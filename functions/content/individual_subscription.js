const {
  GASTROENTEROLOGY,
  INFLAMMATORY_BOWEL_DISEASE,
  HEPATOLOGY,
  ENDOSCOPY,
  FUNCTIONAL_GI_DISORDERS,
} = require('./constants');

const SPECIALTIES = [GASTROENTEROLOGY];

const SUB_SPECIALTIES = [
  INFLAMMATORY_BOWEL_DISEASE,
  HEPATOLOGY,
  ENDOSCOPY,
  FUNCTIONAL_GI_DISORDERS,
];

const IMAGES = [
  {
    src: 'colonoscopy_umkhnz.jpg',
    title: 'Colonoscopy',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'cross_section_vzqxu5.jpg',
    title: 'Cross section',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'dilation_sknzr0.jpg',
    title: 'Dilation',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'fistula_jwtf8j.jpg',
    title: 'Fistula',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'gastrointestinal_tract_owouhp.jpg',
    title: 'Gatrointestinal tract',
    default: true,
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
  src: 'ileal_pouch_anal_anastomosis_rnu59l.jpg',
  title: 'Ileal pouch anal anastomosis',
  specialties: [GASTROENTEROLOGY],
  subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'ileo_colonic_resection_inth6u.jpg',
    title: 'Ileo colonic resection',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'lumen_aatjzd.jpg',
    title: 'Lumen',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'peri_anal_abcess_d8hzr8.jpg',
    title: 'Peri anal abcess',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'pouch_stages_ytqivx.jpg',
    title: 'Pouch stages',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'pouchitis_abbrvo.jpg',
    title: 'Pouchitis',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'right_hemi_colectomy_hhawou.jpg',
    title: 'Right hemi colectomy',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'stoma_bag_moge6h.jpg',
    title: 'Stoma bag',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'stoma_types_btv9t5.jpg',
    title: 'Stoma types',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'stomas_qnuc6o.jpg',
    title: 'Stomas',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'strictures_u1glnl.jpg',
    title: 'Strictures',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'stricturoplasty_sgundw.jpg',
    title: 'Stricturoplasty',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
  {
    src: 'ulcerative_colitis_extent_bswapp.jpg',
    title: 'Ulcerative colitis extent',
    specialties: [GASTROENTEROLOGY],
    subSpecialties: [
    INFLAMMATORY_BOWEL_DISEASE,
    HEPATOLOGY,
    ENDOSCOPY,
    FUNCTIONAL_GI_DISORDERS,
    ],
  },
];

const CONTENT_INDIVIDUAL = {
  specialties: SPECIALTIES,
  subSpecialties: SUB_SPECIALTIES,
  images: IMAGES,
};

exports.CONTENT_INDIVIDUAL = CONTENT_INDIVIDUAL;