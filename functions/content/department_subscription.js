const SPECIALTIES = ['Cardiology'];

const SUB_SPECIALTIES = [
  'Cardiology_one',
  'Cardiology_two',
  'Cardiology_three',
  'Cardiology_four',
];

const IMAGES = [
 {
   src: '',
   title: 'Lumen',
   specialties: ['Cardiology'],
   subSpecialties: [
     'Cardiology_one',
     'Cardiology_two',
    ],
 },
 {
   src: '',
   title: 'Colonoscopy',
   specialties: ['Cardiology'],
   subSpecialties: [
     'Cardiology_one',
     'Cardiology_two',
    ],
 },
 {
   src: '',
   title: 'Cross section',
   specialties: ['Cardiology'],
   subSpecialties: [
     'Cardiology_one',
     'Cardiology_three',
    ],
 },
 {
   src: '',
   title: 'Cardiology_three',
   specialties: ['Cardiology'],
   subSpecialties: [
     'Cardiology_one',
     'Cardiology_four',
    ],
 },
 {
   src: '',
   title: 'Stiches',
   specialties: ['Cardiology'],
   subSpecialties: [
     'Cardiology_one',
    ],
 },
];

const CONTENT_DEPARTMENT = {
  specialties: SPECIALTIES,
  subSpecialties: SUB_SPECIALTIES,
  images: IMAGES,
};

exports.CONTENT_DEPARTMENT = CONTENT_DEPARTMENT;