/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransitLine, Stop } from '../types';

export const TRANSIT_LINES: TransitLine[] = [
  {
    id: 'mrt3',
    name: 'Luzon MRT-3 (Blue Train Line)',
    type: 'Train',
    color: '#0052cc',
    baseFare: 13.00,
    perKmFare: 1.00,
    minDistance: 4,
    stops: [
      { id: 'mrt3-north', name: 'North Avenue', lat: 14.6549, lng: 121.0305, order: 1 },
      { id: 'mrt3-quezon', name: 'Quezon Avenue', lat: 14.6425, lng: 121.0374, order: 2 },
      { id: 'mrt3-kamuning', name: 'Kamuning', lat: 14.6293, lng: 121.0435, order: 3 },
      { id: 'mrt3-cubao', name: 'Araneta Center-Cubao (MRT)', lat: 14.6194, lng: 121.0511, order: 4 },
      { id: 'mrt3-santolan', name: 'Santolan-Anonas (Boni Serrano)', lat: 14.6074, lng: 121.0563, order: 5 },
      { id: 'mrt3-ortigas', name: 'Ortigas', lat: 14.5878, lng: 121.0567, order: 6 },
      { id: 'mrt3-shaw', name: 'Shaw Boulevard', lat: 14.5813, lng: 121.0537, order: 7 },
      { id: 'mrt3-boni', name: 'Boni', lat: 14.5739, lng: 121.0482, order: 8 },
      { id: 'mrt3-guadalupe', name: 'Guadalupe', lat: 14.5672, lng: 121.0454, order: 9 },
      { id: 'mrt3-buendia', name: 'Buendia (MRT)', lat: 14.5542, lng: 121.0349, order: 10 },
      { id: 'mrt3-ayala', name: 'Ayala', lat: 14.5491, lng: 121.0278, order: 11 },
      { id: 'mrt3-magallanes', name: 'Magallanes', lat: 14.5421, lng: 121.0195, order: 12 },
      { id: 'mrt3-taft', name: 'Taft Avenue (EDSA)', lat: 14.5376, lng: 121.0013, order: 13 },
    ]
  },
  {
    id: 'lrt2',
    name: 'Luzon LRT-2 (Purple Train Line)',
    type: 'Train',
    color: '#7030a0',
    baseFare: 15.00,
    perKmFare: 1.20,
    minDistance: 4,
    stops: [
      { id: 'lrt2-recto', name: 'Recto', lat: 14.6038, lng: 120.9822, order: 1 },
      { id: 'lrt2-legarda', name: 'Legarda', lat: 14.6009, lng: 120.9922, order: 2 },
      { id: 'lrt2-pureza', name: 'Pureza', lat: 14.6015, lng: 121.0055, order: 3 },
      { id: 'lrt2-vmapa', name: 'V. Mapa', lat: 14.6014, lng: 121.0223, order: 4 },
      { id: 'lrt2-jruiz', name: 'J. Ruiz', lat: 14.6104, lng: 121.0300, order: 5 },
      { id: 'lrt2-gilmore', name: 'Gilmore', lat: 14.6135, lng: 121.0343, order: 6 },
      { id: 'lrt2-betty', name: 'Betty Go-Belmonte', lat: 14.6186, lng: 121.0425, order: 7 },
      { id: 'lrt2-cubao', name: 'Araneta Center-Cubao (LRT)', lat: 14.6219, lng: 121.0503, order: 8 },
      { id: 'lrt2-anonas', name: 'Anonas', lat: 14.6282, lng: 121.0645, order: 9 },
      { id: 'lrt2-katipunan', name: 'Katipunan', lat: 14.6300, lng: 121.0731, order: 10 },
      { id: 'lrt2-santolan', name: 'Santolan', lat: 14.6225, lng: 121.0858, order: 11 },
      { id: 'lrt2-marikina', name: 'Marikina-Pasig', lat: 14.6200, lng: 121.0995, order: 12 },
      { id: 'lrt2-antipolo', name: 'Antipolo', lat: 14.6247, lng: 121.1215, order: 13 },
    ]
  },
  {
    id: 'lrt1',
    name: 'Luzon LRT-1 (Green Train Line)',
    type: 'Train',
    color: '#00B050',
    baseFare: 15.00,
    perKmFare: 1.10,
    minDistance: 4,
    stops: [
      { id: 'lrt1-baclaran', name: 'Baclaran', lat: 14.5283, lng: 120.9984, order: 1 },
      { id: 'lrt1-edsa', name: 'EDSA (Taft Crossing)', lat: 14.5385, lng: 121.0003, order: 2 },
      { id: 'lrt1-libertad', name: 'Libertad', lat: 14.5476, lng: 120.9985, order: 3 },
      { id: 'lrt1-gilpuyat', name: 'Gil Puyat (Buendia)', lat: 14.5539, lng: 120.9972, order: 4 },
      { id: 'lrt1-vitocruz', name: 'Vito Cruz (LRT)', lat: 14.5632, lng: 120.9947, order: 5 },
      { id: 'lrt1-quirino', name: 'Quirino', lat: 14.5701, lng: 120.9912, order: 6 },
      { id: 'lrt1-pedrogil', name: 'Pedro Gil', lat: 14.5768, lng: 120.9881, order: 7 },
      { id: 'lrt1-un', name: 'United Nations', lat: 14.5824, lng: 120.9841, order: 8 },
      { id: 'lrt1-central', name: 'Central Terminal', lat: 14.5932, lng: 120.9813, order: 9 },
      { id: 'lrt1-carriedo', name: 'Carriedo', lat: 14.5996, lng: 120.9808, order: 10 },
      { id: 'lrt1-doroteo', name: 'Doroteo Jose', lat: 14.6055, lng: 120.9818, order: 11 },
      { id: 'lrt1-bambang', name: 'Bambang', lat: 14.6119, lng: 120.9821, order: 12 },
      { id: 'lrt1-tayuman', name: 'Tayuman', lat: 14.6169, lng: 120.9828, order: 13 },
      { id: 'lrt1-blumentritt', name: 'Blumentritt (LRT)', lat: 14.6225, lng: 120.9839, order: 14 },
      { id: 'lrt1-abadsantos', name: 'Abad Santos', lat: 14.6305, lng: 120.9817, order: 15 },
      { id: 'lrt1-rpapa', name: 'R. Papa', lat: 14.6360, lng: 120.9824, order: 16 },
      { id: 'lrt1-5thave', name: '5th Avenue Caloocan', lat: 14.6444, lng: 120.9836, order: 17 },
      { id: 'lrt1-monumento', name: 'Monumento', lat: 14.6534, lng: 120.9839, order: 18 },
      { id: 'lrt1-balintawak', name: 'Balintawak', lat: 14.6575, lng: 121.0012, order: 19 },
      { id: 'lrt1-roosevelt', name: 'Roosevelt (FPJ)', lat: 14.6576, lng: 121.0210, order: 20 },
    ]
  },
  {
    id: 'pnr',
    name: 'Luzon PNR Metro Commuter',
    type: 'Train',
    color: '#ed7d31',
    baseFare: 15.00,
    perKmFare: 1.00,
    minDistance: 14,
    stops: [
      { id: 'pnr-tutuban', name: 'Tutuban PNR', lat: 14.6074, lng: 120.9739, order: 1 },
      { id: 'pnr-blumentritt', name: 'Blumentritt (PNR)', lat: 14.6223, lng: 120.9833, order: 2 },
      { id: 'pnr-espana', name: 'España', lat: 14.6080, lng: 121.0016, order: 3 },
      { id: 'pnr-stamesa', name: 'Santa Mesa', lat: 14.5985, lng: 121.0118, order: 4 },
      { id: 'pnr-paco', name: 'Paco Terminal', lat: 14.5794, lng: 121.0008, order: 5 },
      { id: 'pnr-sanandres', name: 'San Andres', lat: 14.5724, lng: 121.0019, order: 6 },
      { id: 'pnr-vitocruz', name: 'Vito Cruz (PNR)', lat: 14.5645, lng: 121.0028, order: 7 },
      { id: 'pnr-buendia', name: 'Buendia (PNR)', lat: 14.5510, lng: 121.0062, order: 8 },
      { id: 'pnr-pasayroad', name: 'Pasay Road', lat: 14.5422, lng: 121.0123, order: 9 },
      { id: 'pnr-edsa', name: 'EDSA Magallanes (PNR)', lat: 14.5376, lng: 121.0192, order: 10 },
      { id: 'pnr-nichols', name: 'Nichols (Sales)', lat: 14.5186, lng: 121.0189, order: 11 },
      { id: 'pnr-alabang', name: 'Alabang Terminal', lat: 14.4172, lng: 121.0435, order: 12 },
    ]
  },
  {
    id: 'luzon-bus-carousel',
    name: 'Luzon EDSA Bus Carousel',
    type: 'Bus',
    color: '#e24343',
    baseFare: 15.00,
    perKmFare: 2.20,
    minDistance: 5,
    stops: [
      { id: 'l-bus-monumento', name: 'Monumento Bus Hub', lat: 14.6534, lng: 120.9839, order: 1 },
      { id: 'l-bus-quezon', name: 'Quezon Ave Bus Stop', lat: 14.6425, lng: 121.0374, order: 2 },
      { id: 'l-bus-ortigas', name: 'Ortigas Bus Stop', lat: 14.5878, lng: 121.0567, order: 3 },
      { id: 'l-bus-ayala', name: 'Ayala Bus Terminal', lat: 14.5491, lng: 121.0278, order: 4 },
      { id: 'l-bus-moa', name: 'MOA Bus Stop', lat: 14.5350, lng: 120.9820, order: 5 },
      { id: 'l-bus-pitx', name: 'PITX Central Terminal', lat: 14.5085, lng: 120.9942, order: 6 },
    ]
  },
  {
    id: 'luzon-provincial-bus',
    name: 'Luzon Provincial Bus (Manila-Baguio Line)',
    type: 'Bus',
    color: '#9E2A2B',
    baseFare: 450.00,
    perKmFare: 2.50,
    minDistance: 50,
    stops: [
      { id: 'luzon-prov-cubao', name: 'Cubao Bus Terminal', lat: 14.6194, lng: 121.0511, order: 1 },
      { id: 'luzon-prov-tarlac', name: 'Tarlac Provincial Terminal', lat: 15.4851, lng: 120.5960, order: 2 },
      { id: 'luzon-prov-urdaneta', name: 'Urdaneta Pangasinan Stop', lat: 15.9758, lng: 120.5707, order: 3 },
      { id: 'luzon-prov-baguio', name: 'Baguio City Central Terminal', lat: 16.4164, lng: 120.5930, order: 4 },
    ]
  },
  {
    id: 'luzon-uv-fairview',
    name: 'Luzon UV: Fairview - Buendia Route',
    type: 'UV Express',
    color: '#00aaaa',
    baseFare: 25.00,
    perKmFare: 2.80,
    minDistance: 6,
    stops: [
      { id: 'uv-fairview', name: 'Fairview Terraces Hub', lat: 14.7335, lng: 121.0581, order: 1 },
      { id: 'uv-tangsora', name: 'Commonwealth Tandang Sora', lat: 14.6672, lng: 121.0782, order: 2 },
      { id: 'uv-philcoa', name: 'Philcoa Express Stop', lat: 14.6521, lng: 121.0535, order: 3 },
      { id: 'uv-mrtcentris', name: 'MRT Centris Hub', lat: 14.6425, lng: 121.0374, order: 4 },
      { id: 'uv-quiapo', name: 'Quiapo Quezon Boulevard Stop', lat: 14.5983, lng: 120.9852, order: 5 },
      { id: 'uv-buendia', name: 'Buendia Gil Puyat UV Station', lat: 14.5539, lng: 120.9972, order: 6 },
    ]
  },
  {
    id: 'jeep-taft',
    name: 'Luzon PUJ: Baclaran - Taft - Cubao',
    type: 'Jeep',
    color: '#ffc000',
    baseFare: 13.00,
    perKmFare: 1.80,
    minDistance: 4,
    stops: [
      { id: 'jeep-baclaran', name: 'Baclaran Jeep Terminal', lat: 14.5283, lng: 120.9984, order: 1 },
      { id: 'jeep-rotonda', name: 'Pasay Rotonda Hub', lat: 14.5385, lng: 121.0003, order: 2 },
      { id: 'jeep-quirino', name: 'Taft - Quirino Intersection', lat: 14.5701, lng: 120.9912, order: 3 },
      { id: 'jeep-cityhall', name: 'Manila City Hall', lat: 14.5891, lng: 120.9814, order: 4 },
      { id: 'jeep-mendiola', name: 'Mendiola Bridge Stop', lat: 14.5996, lng: 120.9922, order: 5 },
      { id: 'jeep-vmapa', name: 'V. Mapa Blvd Stop', lat: 14.6014, lng: 121.0223, order: 6 },
      { id: 'jeep-cubao', name: 'Cubao Aurora Boulevard Puj', lat: 14.6219, lng: 121.0503, order: 7 },
    ]
  },
  {
    id: 'tryke-katip',
    name: 'Luzon Tricycle: Katipunan Inner Loop',
    type: 'Tricycle',
    color: '#7f7f7f',
    baseFare: 15.00,
    perKmFare: 5.00,
    minDistance: 1,
    stops: [
      { id: 'tryke-station', name: 'Katipunan Tricycle Station', lat: 14.6300, lng: 121.0731, order: 1 },
      { id: 'tryke-lavista', name: 'La Vista Main Gate', lat: 14.6420, lng: 121.0790, order: 2 },
      { id: 'tryke-up', name: 'UP Diliman Campus Hub', lat: 14.6537, lng: 121.0685, order: 3 },
    ]
  },

  // --- VISAYAS REGION TRANSIT DATA ---
  {
    id: 'visayas-lrt',
    name: 'Visayas LRT Cebu Metro Trans-Express (Line 1)',
    type: 'Train',
    color: '#2A9D8F',
    baseFare: 15.00,
    perKmFare: 1.20,
    minDistance: 4,
    stops: [
      { id: 'v-lrt-talisay', name: 'Talisay Central Depot', lat: 10.2589, lng: 123.8394, order: 1 },
      { id: 'v-lrt-bulacao', name: 'Bulacao Bus-Transit Link', lat: 10.2818, lng: 123.8512, order: 2 },
      { id: 'v-lrt-pardo', name: 'Pardo Town Plaza', lat: 10.2934, lng: 123.8610, order: 3 },
      { id: 'v-lrt-basak', name: 'Basak San Nicolas', lat: 10.3012, lng: 123.8745, order: 4 },
      { id: 'v-lrt-mambaling', name: 'Mambaling Shopwise Crossing', lat: 10.3129, lng: 123.8820, order: 5 },
      { id: 'v-lrt-colon', name: 'Colon Central Exchange', lat: 10.3060, lng: 123.9015, order: 6 },
      { id: 'v-lrt-fuente', name: 'Fuente Osmeña Commuter Station', lat: 10.3164, lng: 123.8907, order: 7 },
      { id: 'v-lrt-lahug', name: 'Lahug IT Park Terminal', lat: 10.3292, lng: 123.9061, order: 8 },
      { id: 'v-lrt-mandaue', name: 'Mandaue City Station', lat: 10.3444, lng: 123.9318, order: 9 },
    ]
  },
  {
    id: 'visayas-mrt',
    name: 'Visayas MRT Metro Cebu Coastal Link',
    type: 'Train',
    color: '#1D3557',
    baseFare: 16.00,
    perKmFare: 1.30,
    minDistance: 4,
    stops: [
      { id: 'v-mrt-srp', name: 'Cebu SRP Coastal Hub', lat: 10.2794, lng: 123.8921, order: 1 },
      { id: 'v-mrt-seaside', name: 'SM Seaside Coastal Exchange', lat: 10.2811, lng: 123.8824, order: 2 },
      { id: 'v-mrt-carbon', name: 'Cebu Carbon Market Station', lat: 10.2894, lng: 123.9021, order: 3 },
      { id: 'v-mrt-smcity', name: 'SM City Cebu Coastal Port', lat: 10.3121, lng: 123.9185, order: 4 },
      { id: 'v-mrt-mandaue', name: 'Mandaue Reclamation Link', lat: 10.3256, lng: 123.9338, order: 5 },
      { id: 'v-mrt-lapulapu', name: 'Lapu-Lapu Mactan Central Terminal', lat: 10.3142, lng: 123.9632, order: 6 },
    ]
  },
  {
    id: 'visayas-bus',
    name: 'Visayas Cebu BRT Network Bus',
    type: 'Bus',
    color: '#F4A261',
    baseFare: 15.00,
    perKmFare: 2.10,
    minDistance: 4,
    stops: [
      { id: 'v-bus-bulacao', name: 'Bulacao Bus-BRT Terminal', lat: 10.2818, lng: 123.8512, order: 1 },
      { id: 'v-bus-sbt', name: 'Cebu South Bus Terminal', lat: 10.2917, lng: 123.8943, order: 2 },
      { id: 'v-bus-fuente', name: 'Fuente Osmeña BRT Station', lat: 10.3164, lng: 123.8907, order: 3 },
      { id: 'v-bus-itpark', name: 'Cebu Lahug IT Park Bus Hub', lat: 10.3292, lng: 123.9061, order: 4 },
      { id: 'v-bus-mandaue', name: 'Mandaue Central Bus Terminal', lat: 10.3444, lng: 123.9318, order: 5 },
      { id: 'v-bus-lapulapu', name: 'Lapu-Lapu Marina Mall Stop', lat: 10.3445, lng: 123.9782, order: 6 },
    ]
  },
  {
    id: 'visayas-uv-mandaue',
    name: 'Visayas UV Express: Cebu - Mandaue - Lapu-Lapu',
    type: 'UV Express',
    color: '#0077B6',
    baseFare: 30.00,
    perKmFare: 3.00,
    minDistance: 6,
    stops: [
      { id: 'v-uv-sm', name: 'SM City Cebu UV Terminal', lat: 10.3121, lng: 123.9185, order: 1 },
      { id: 'v-uv-mandaue', name: 'Mandaue J Center Mall Stop', lat: 10.3392, lng: 123.9371, order: 2 },
      { id: 'v-uv-pacific', name: 'Mandaue Pacific Mall UV Station', lat: 10.3458, lng: 123.9458, order: 3 },
      { id: 'v-uv-fernan', name: 'Marcelo Fernan Bridge Crossing', lat: 10.3421, lng: 123.9632, order: 4 },
      { id: 'v-uv-lapulapu', name: 'Lapu-Lapu Gaisano Island Mall', lat: 10.3218, lng: 123.9745, order: 5 },
    ]
  },
  {
    id: 'visayas-jeep-cebu',
    name: 'Visayas Cebu Peoples Cooperative Jeepney',
    type: 'Jeep',
    color: '#E76F51',
    baseFare: 15.00,
    perKmFare: 2.00,
    minDistance: 4,
    stops: [
      { id: 'v-jeep-capitol', name: 'Cebu Capitol Building Plaza', lat: 10.3178, lng: 123.8900, order: 1 },
      { id: 'v-jeep-fuente', name: 'Fuente Osmeña Circle Jeep Stop', lat: 10.3164, lng: 123.8907, order: 2 },
      { id: 'v-jeep-colon', name: 'Colon Downtown Junction', lat: 10.3060, lng: 123.9015, order: 3 },
      { id: 'v-jeep-reclamation', name: 'Cebu Reclamation Area', lat: 10.3211, lng: 123.9214, order: 4 },
      { id: 'v-jeep-itpark', name: 'Lahug IT Park Jeep Stop', lat: 10.3292, lng: 123.9061, order: 5 },
    ]
  },

  // --- MINDANAO REGION TRANSIT DATA ---
  {
    id: 'mindanao-lrt',
    name: 'Mindanao LRT Zamboanga Commuter (Line 1)',
    type: 'Train',
    color: '#8338EC',
    baseFare: 15.00,
    perKmFare: 1.15,
    minDistance: 4,
    stops: [
      { id: 'm-lrt-recodo', name: 'Recodo Port Depot', lat: 6.9451, lng: 122.0125, order: 1 },
      { id: 'm-lrt-sanroque', name: 'San Roque Terminal', lat: 6.9294, lng: 122.0410, order: 2 },
      { id: 'm-lrt-canelar', name: 'Canelar Central Station', lat: 6.9142, lng: 122.0725, order: 3 },
      { id: 'm-lrt-cityhall', name: 'Zamboanga City Hall Station', lat: 6.9025, lng: 122.0791, order: 4 },
      { id: 'm-lrt-pueblo', name: 'Pueblo Crossing Mall', lat: 6.9094, lng: 122.0912, order: 5 },
      { id: 'm-lrt-tetuan', name: 'Tetuan Commuter Terminal', lat: 6.9215, lng: 122.1082, order: 6 },
    ]
  },
  {
    id: 'mindanao-mrt',
    name: 'Mindanao MRT Metro Davao Rapid Train Transit',
    type: 'Train',
    color: '#3A86C8',
    baseFare: 15.00,
    perKmFare: 1.25,
    minDistance: 4,
    stops: [
      { id: 'm-mrt-toril', name: 'Toril Terminal depot', lat: 7.0143, lng: 125.4981, order: 1 },
      { id: 'm-mrt-mintal', name: 'Mintal Central Station', lat: 7.0724, lng: 125.5392, order: 2 },
      { id: 'm-mrt-ulas', name: 'Ulas Interchange Link', lat: 7.0592, lng: 125.5684, order: 3 },
      { id: 'm-mrt-matina', name: 'Matina Crossing Station', lat: 7.0610, lng: 125.5912, order: 4 },
      { id: 'm-mrt-bankerohan', name: 'Bankerohan Bridge Terminal', lat: 7.0712, lng: 125.6025, order: 5 },
      { id: 'm-mrt-townhall', name: 'Davao City Hall Plaza', lat: 7.0645, lng: 125.6083, order: 6 },
      { id: 'm-mrt-lanang', name: 'Lanang SM Lanang Premier', lat: 7.1009, lng: 125.6315, order: 7 },
      { id: 'm-mrt-sasa', name: 'Sasa Ferry Wharf Station', lat: 7.1251, lng: 125.6582, order: 8 },
    ]
  },
  {
    id: 'mindanao-bus',
    name: 'Mindanao Davao City High-Priority Bus Express',
    type: 'Bus',
    color: '#E63946',
    baseFare: 15.00,
    perKmFare: 2.25,
    minDistance: 5,
    stops: [
      { id: 'm-bus-toril', name: 'Toril Bus Depot Hub', lat: 7.0143, lng: 125.4981, order: 1 },
      { id: 'm-bus-ecoland', name: 'Ecoland Transport Terminal', lat: 7.0521, lng: 125.5925, order: 2 },
      { id: 'm-bus-bankerohan', name: 'Bankerohan Public Market Stop', lat: 7.0712, lng: 125.6025, order: 3 },
      { id: 'm-bus-abreeza', name: 'Abreeza Mall Express Stop', lat: 7.0874, lng: 125.6138, order: 4 },
      { id: 'm-bus-lanang', name: 'Lanang Robinsons Bus Stop', lat: 7.1009, lng: 125.6315, order: 5 },
      { id: 'm-bus-sasa', name: 'Sasa Wharf Port Bus Stop', lat: 7.1251, lng: 125.6582, order: 6 },
    ]
  },
  {
    id: 'mindanao-uv-express',
    name: 'Mindanao UV Express: CDO - Iligan Transit Link',
    type: 'UV Express',
    color: '#023E8A',
    baseFare: 35.00,
    perKmFare: 3.20,
    minDistance: 6,
    stops: [
      { id: 'm-uv-bulua', name: 'Cagayan De Oro Bulua Terminal', lat: 8.4905, lng: 124.6041, order: 1 },
      { id: 'm-uv-opol', name: 'Opol Municipal Plaza Stop', lat: 8.4721, lng: 124.5714, order: 2 },
      { id: 'm-uv-elsalvador', name: 'El Salvador City UV Station', lat: 8.4419, lng: 124.5126, order: 3 },
      { id: 'm-uv-airport', name: 'Laguindingan Airport Hub', lat: 8.4611, lng: 124.4532, order: 4 },
      { id: 'm-uv-iligan', name: 'Iligan City North Terminal', lat: 8.2435, lng: 124.2589, order: 5 },
    ]
  },
  {
    id: 'mindanao-jeep',
    name: 'Mindanao Davao Peoples Modernised Jeepney PUJ',
    type: 'Jeep',
    color: '#FFB703',
    baseFare: 14.00,
    perKmFare: 1.90,
    minDistance: 4,
    stops: [
      { id: 'm-jeep-toril', name: 'Toril Jeep Central Terminal', lat: 7.0143, lng: 125.4981, order: 1 },
      { id: 'm-jeep-ulas', name: 'Ulas Crossing Jeep Terminal', lat: 7.0592, lng: 125.5684, order: 2 },
      { id: 'm-jeep-bankerohan', name: 'Bankerohan Public Market Stop', lat: 7.0712, lng: 125.6025, order: 3 },
      { id: 'm-jeep-claveria', name: 'Claveria Recto Avenue Stop', lat: 7.0725, lng: 125.6110, order: 4 },
      { id: 'm-jeep-agdao', name: 'Agdao Public Market Terminal', lat: 7.0811, lng: 125.6215, order: 5 },
    ]
  }
];

// Helper to gather all stops sorted alphabetically
export const ALL_UNIQUE_STOPS: Stop[] = (() => {
  const map = new Map<string, Stop>();
  TRANSIT_LINES.forEach(line => {
    line.stops.forEach(stop => {
      // De-duplicate stops by coordinates and approximate name mapping
      const key = `${stop.lat.toFixed(4)},${stop.lng.toFixed(4)}`;
      const existing = map.get(key);
      if (!existing || stop.name.length < existing.name.length) {
        map.set(key, stop);
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
})();

// SQLite Schema & Query template metadata formatted for visual representation
export const SQLITE_DATABASE_METADATA = {
  schema: `--- CREATE SCHEMAS FOR MOODERIA COMMUTE ---

CREATE TABLE IF NOT EXISTS transit_lines (
  line_id TEXT PRIMARY KEY,
  line_name TEXT NOT NULL,
  transit_type TEXT NOT NULL CHECK(transit_type IN ('Train', 'Jeep', 'UV Express', 'Bus', 'Tricycle')),
  stroke_color TEXT DEFAULT '#7030a0',
  base_fare REAL NOT NULL,
  per_km_fare REAL NOT NULL,
  min_distance REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS transit_stops (
  stop_id TEXT PRIMARY KEY,
  stop_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS line_stops (
  line_id TEXT NOT NULL,
  stop_id TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  PRIMARY KEY (line_id, stop_id),
  FOREIGN KEY (line_id) REFERENCES transit_lines(line_id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES transit_stops(stop_id) ON DELETE CASCADE
);`,
  seeds: `--- INSERT PHILIPPINE TRANSIT LINES INDICES ---
INSERT INTO transit_lines (line_id, line_name, transit_type, stroke_color, base_fare, per_km_fare, min_distance)
VALUES
('mrt3', 'Luzon MRT-3 (Blue Train Line)', 'Train', '#0052cc', 13.00, 1.00, 4.0),
('lrt2', 'Luzon LRT-2 (Purple Train Line)', 'Train', '#7030a0', 15.00, 1.20, 4.0),
('lrt1', 'Luzon LRT-1 (Green Train Line)', 'Train', '#00B050', 15.00, 1.10, 4.0),
('visayas-lrt', 'Visayas LRT Cebu Metro Trans-Express (Line 1)', 'Train', '#2A9D8F', 15.00, 1.20, 4.0),
('mindanao-mrt', 'Mindanao MRT Metro Davao Rapid Train Transit', 'Train', '#3A86C8', 15.00, 1.25, 4.0),
('luzon-bus-carousel', 'Luzon EDSA Bus Carousel', 'Bus', '#e24343', 15.00, 2.20, 5.0),
('visayas-bus', 'Visayas Cebu BRT Network Bus', 'Bus', '#F4A261', 15.00, 2.10, 4.0);`
};
