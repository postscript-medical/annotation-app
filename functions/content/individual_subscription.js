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
   src: '',
   title: 'Lumen',
   specialties: [GASTROENTEROLOGY],
   subSpecialties: [
     INFLAMMATORY_BOWEL_DISEASE,
     HEPATOLOGY,
    ],
 },
 {
   src: '',
   title: 'Colonoscopy',
   specialties: [GASTROENTEROLOGY],
   subSpecialties: [
     INFLAMMATORY_BOWEL_DISEASE,
     HEPATOLOGY,
    ],
 },
 {
   src: '',
   title: 'Cross section',
   specialties: [GASTROENTEROLOGY],
   subSpecialties: [
     INFLAMMATORY_BOWEL_DISEASE,
     ENDOSCOPY,
    ],
 },
 {
   src: '',
   title: ENDOSCOPY,
   specialties: [GASTROENTEROLOGY],
   subSpecialties: [
     INFLAMMATORY_BOWEL_DISEASE,
     FUNCTIONAL_GI_DISORDERS,
    ],
 },
 {
   src: '',
   title: 'Stiches',
   specialties: [GASTROENTEROLOGY],
   subSpecialties: [
     INFLAMMATORY_BOWEL_DISEASE,
    ],
 },
];

const CONTENT_INDIVIDUAL = {
  specialties: SPECIALTIES,
  subSpecialties: SUB_SPECIALTIES,
  images: IMAGES,
};

exports.CONTENT_INDIVIDUAL = CONTENT_INDIVIDUAL;