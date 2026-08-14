/* ==========================================================================
   Données du site — fichier généré depuis admin.html.
   Vous pouvez aussi le modifier à la main : la structure reste la même.
   Dernière mise à jour : 29/07/2026 01:25:41
   ========================================================================== */

/* --------------------------------------------------------------------------
   1) Coordonnées de la boutique
   -------------------------------------------------------------------------- */
const SHOP = {
  name: 'COMFY UNIFORMS',

  // Numéro WhatsApp au format international SANS "+" ni espaces.
  // 0773 74 73 89  ->  '213773747389'
  whatsapp: '213773747389',

  phoneDisplay: '0773 74 73 89',
  phoneHref: '+213773747389',
  email: 'contact@comfyuniforms.dz',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  currency: 'DA',
  currencyAr: 'دج',

  // Livraison : gratuite à partir de ce montant (0 = jamais gratuite)
  deliveryFee: 600,
  freeDeliveryFrom: 15000
};

/* --------------------------------------------------------------------------
   2) Catégories
   -------------------------------------------------------------------------- */
const CATEGORIES = [
  { id: 'radiologie', name: 'Tenues Radiologie', name_ar: 'ملابس الأشعة', img: 'assets/img/cat-radiologie.jpg' },
  { id: 'blouses', name: 'Blouses Médicales', name_ar: 'المآزر الطبية', img: 'assets/img/cat-blouses.jpg' },
  { id: 'homme', name: 'Ensembles Homme', name_ar: 'أطقم رجالية', img: 'assets/img/cat-homme.jpg' },
  { id: 'femme', name: 'Ensembles Femme', name_ar: 'أطقم نسائية', img: 'assets/img/cat-femme.jpg' },
  { id: 'accessoires', name: 'Accessoires', name_ar: 'إكسسوارات', img: 'assets/img/cat-accessoires.jpg' }
];

/* --------------------------------------------------------------------------
   3) Couleurs réutilisables
   -------------------------------------------------------------------------- */
const C = {
  vert: { hex: '#0F5C50', name: 'Vert émeraude', name_ar: 'أخضر زمردي' },
  navy: { hex: '#0A1F3C', name: 'Bleu marine', name_ar: 'أزرق كحلي' },
  ciel: { hex: '#7C93B3', name: 'Bleu ciel', name_ar: 'أزرق سماوي' },
  blanc: { hex: '#FFFFFF', name: 'Blanc', name_ar: 'أبيض' },
  menthe: { hex: '#CFE7E0', name: 'Vert menthe', name_ar: 'أخضر نعناعي' },
  sauge: { hex: '#2E7D6B', name: 'Vert sauge', name_ar: 'أخضر مريمي' },
  gris: { hex: '#4A5568', name: 'Gris anthracite', name_ar: 'رمادي داكن' },
  poudre: { hex: '#A7C4E8', name: 'Bleu poudre', name_ar: 'أزرق فاتح' },
  bordeau: { hex: '#7B2D3B', name: 'Bordeaux', name_ar: 'خمري' },
  lilas: { hex: '#9B8AC4', name: 'Lilas', name_ar: 'ليلكي' }
};

const SIZES_STD = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SIZES_ACC = ['Taille unique'];

/* --------------------------------------------------------------------------
   4) Catalogue produits
        img : si le fichier photo n'existe pas, un cadre gris s'affiche.
   -------------------------------------------------------------------------- */
const PRODUCTS = [
  {
    id: 'tenues-medicale',
    name: 'tenues médicale',
    name_ar: 'لباس طبي',
    cat: 'homme',
    price: 7000, oldPrice: 8000,
    rating: 5, reviews: 0,
    tag: null, tag_ar: null,
    featured: false,
    colors: [C.navy],
    sizes: SIZES_STD,
    img: 'assets/img/products/tenues-medicale.jpg',
    desc: '',
    desc_ar: '',
    fabric: '',
    fabric_ar: '',
    care: '',
    care_ar: ''
  }
];

/* --------------------------------------------------------------------------
   5) Wilayas (pour le formulaire de commande)
   -------------------------------------------------------------------------- */
const WILAYAS = [
  '01 Adrar', '02 Chlef', '03 Laghouat', '04 Oum El Bouaghi',
  '05 Batna', '06 Béjaïa', '07 Biskra', '08 Béchar',
  '09 Blida', '10 Bouira', '11 Tamanrasset', '12 Tébessa',
  '13 Tlemcen', '14 Tiaret', '15 Tizi Ouzou', '16 Alger',
  '17 Djelfa', '18 Jijel', '19 Sétif', '20 Saïda',
  '21 Skikda', '22 Sidi Bel Abbès', '23 Annaba', '24 Guelma',
  '25 Constantine', '26 Médéa', '27 Mostaganem', '28 M’Sila',
  '29 Mascara', '30 Ouargla', '31 Oran', '32 El Bayadh',
  '33 Illizi', '34 Bordj Bou Arréridj', '35 Boumerdès', '36 El Tarf',
  '37 Tindouf', '38 Tissemsilt', '39 El Oued', '40 Khenchela',
  '41 Souk Ahras', '42 Tipaza', '43 Mila', '44 Aïn Defla',
  '45 Naâma', '46 Aïn Témouchent', '47 Ghardaïa', '48 Relizane',
  '49 Timimoun', '50 Bordj Badji Mokhtar', '51 Ouled Djellal', '52 Béni Abbès',
  '53 In Salah', '54 In Guezzam', '55 Touggourt', '56 Djanet',
  '57 El M’Ghair', '58 El Meniaa'
];

/* --------------------------------------------------------------------------
   Aides d'accès
   -------------------------------------------------------------------------- */
function getProduct(id) {
  return PRODUCTS.find(function (p) { return p.id === id; }) || null;
}
function getCategory(id) {
  return CATEGORIES.find(function (c) { return c.id === id; }) || null;
}
function countByCategory(id) {
  return PRODUCTS.filter(function (p) { return p.cat === id; }).length;
}
