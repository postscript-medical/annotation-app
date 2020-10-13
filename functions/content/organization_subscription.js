const SPECIALTIES = ['Pulmonar'];

const SUB_SPECIALTIES = [
  'Pulmonar_one',
  'Pulmonar_two',
  'Pulmonar_three',
  'Pulmonar_four',
];

const IMAGES = [
 {
   src: '',
   title: 'Lumen',
   specialties: ['Pulmonar'],
   subSpecialties: [
     'Pulmonar_one',
     'Pulmonar_two',
    ],
 },
 {
   src: '',
   title: 'Colonoscopy',
   specialties: ['Pulmonar'],
   subSpecialties: [
     'Pulmonar_one',
     'Pulmonar_two',
    ],
 },
 {
   src: '',
   title: 'Cross section',
   specialties: ['Pulmonar'],
   subSpecialties: [
     'Pulmonar_one',
     'Pulmonar_three',
    ],
 },
 {
   src: '',
   title: 'Pulmonar_three',
   specialties: ['Pulmonar'],
   subSpecialties: [
     'Pulmonar_one',
     'Pulmonar_four',
    ],
 },
 {
   src: '',
   title: 'Stiches',
   specialties: ['Pulmonar'],
   subSpecialties: [
     'Pulmonar_one',
    ],
 },
];

const CONTENT_ORGANIZATION = {
  specialties: SPECIALTIES,
  subSpecialties: SUB_SPECIALTIES,
  images: IMAGES,
};

exports.CONTENT_ORGANIZATION = CONTENT_ORGANIZATION;