/* ==========================================================================
   Publication en ligne depuis le navigateur (téléphone compris).
   Écrit directement dans le dépôt GitHub ; Cloudflare redéploie tout seul.

   Le jeton d'accès est saisi une fois et reste dans CE navigateur
   (localStorage). Il n'est envoyé qu'à api.github.com, jamais ailleurs.
   ========================================================================== */

const GH = (function () {
  const KEY = 'cu_gh_v1';
  const API = 'https://api.github.com';

  let cfg = { token: '', owner: '', repo: '', branch: 'main' };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) cfg = Object.assign(cfg, JSON.parse(raw));
  } catch (e) { /* réglages illisibles : on repart à zéro */ }

  function headers() {
    return {
      'Authorization': 'Bearer ' + cfg.token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  function base() {
    return API + '/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo);
  }

  /** Appel API avec message d'erreur lisible plutôt qu'un code brut. */
  async function call(url, options) {
    const res = await fetch(url, Object.assign({ headers: headers() }, options || {}));
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (e) { /* corps non JSON */ }
      const err = new Error(detail || ('HTTP ' + res.status));
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  /** UTF-8 → base64, sans casser l'arabe ni les accents. */
  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  return {
    get: function () { return Object.assign({}, cfg); },

    isReady: function () {
      return !!(cfg.token && cfg.owner && cfg.repo && cfg.branch);
    },

    save: function (next) {
      cfg = Object.assign(cfg, next);
      try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* ignoré */ }
    },

    forget: function () {
      cfg = { token: '', owner: '', repo: '', branch: 'main' };
      try { localStorage.removeItem(KEY); } catch (e) { /* ignoré */ }
    },

    /** Vérifie le jeton et les droits d'écriture sur le dépôt. */
    test: async function () {
      const repo = await call(base());
      if (!repo.permissions || !repo.permissions.push) {
        throw new Error('Ce jeton peut lire le dépôt mais pas y écrire.');
      }
      await call(base() + '/git/ref/heads/' + encodeURIComponent(cfg.branch));
      return { full_name: repo.full_name, private: repo.private, branch: cfg.branch };
    },

    /**
     * Envoie plusieurs fichiers en UN SEUL commit — donc un seul redéploiement.
     * files : [{ path, text }] ou [{ path, base64 }]
     */
    commit: async function (files, message, onStep) {
      const step = onStep || function () {};

      step('Lecture de la branche…');
      const ref = await call(base() + '/git/ref/heads/' + encodeURIComponent(cfg.branch));
      const headSha = ref.object.sha;
      const headCommit = await call(base() + '/git/commits/' + headSha);

      const tree = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        step('Envoi ' + (i + 1) + '/' + files.length + ' : ' + f.path.split('/').pop());
        const blob = await call(base() + '/git/blobs', {
          method: 'POST',
          body: JSON.stringify(
            f.base64 !== undefined
              ? { content: f.base64, encoding: 'base64' }
              : { content: toBase64(f.text), encoding: 'base64' }
          )
        });
        tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
      }

      step('Assemblage…');
      const newTree = await call(base() + '/git/trees', {
        method: 'POST',
        body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: tree })
      });

      const commit = await call(base() + '/git/commits', {
        method: 'POST',
        body: JSON.stringify({ message: message, tree: newTree.sha, parents: [headSha] })
      });

      step('Publication…');
      await call(base() + '/git/refs/heads/' + encodeURIComponent(cfg.branch), {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha })
      });

      return commit.sha.slice(0, 7);
    }
  };
})();

/* --------------------------------------------------------------------------
   Photos : réduction avant envoi.
   Une photo de téléphone fait 3 à 5 Mo — impossible à publier tel quel et
   très lent à charger pour les clients. On la ramène à ~1200 px.
   -------------------------------------------------------------------------- */

function compressImage(file, maxSide, quality) {
  maxSide = maxSide || 1200;
  quality = quality || 0.82;

  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onerror = function () { reject(new Error('Lecture du fichier impossible.')); };
    reader.onload = function () {
      const img = new Image();
      img.onerror = function () { reject(new Error('Ce fichier n’est pas une image valide.')); };
      img.onload = function () {
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Fond blanc : un PNG transparent deviendrait noir en JPEG.
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({
          dataUrl: dataUrl,
          base64: base64,
          width: width,
          height: height,
          bytes: Math.round(base64.length * 3 / 4)
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatBytes(n) {
  if (n < 1024) return n + ' o';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' Ko';
  return (n / (1024 * 1024)).toFixed(1) + ' Mo';
}
