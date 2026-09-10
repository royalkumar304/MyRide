export interface CityOption {
  id: string;
  name: string;
  state: string;
  isPopular: boolean;
  hubs: string[];
}

export const POPULAR_CITIES: CityOption[] = [
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar', 'Charbagh Station'],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    isPopular: true,
    hubs: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C-Scheme', 'Sindhi Camp'],
  },
  {
    id: 'indore',
    name: 'Indore',
    state: 'Madhya Pradesh',
    isPopular: true,
    hubs: ['Vijay Nagar', 'Palasia', 'Bhawarkua', 'Rajwada', 'Airport Road'],
  },
  {
    id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    isPopular: true,
    hubs: ['MP Nagar', 'Arera Colony', 'Kolar Road', 'Hoshangabad Road'],
  },
  {
    id: 'kanpur',
    name: 'Kanpur',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Kakadeo', 'Swaroop Nagar', 'Civil Lines', 'Kidwai Nagar'],
  },
  {
    id: 'patna',
    name: 'Patna',
    state: 'Bihar',
    isPopular: true,
    hubs: ['Boring Road', 'Kankarbagh', 'Bailey Road', 'Frazer Road'],
  },
  {
    id: 'dehradun',
    name: 'Dehradun',
    state: 'Uttarakhand',
    isPopular: true,
    hubs: ['Rajpur Road', 'Jakhan', 'ISBT', 'Clock Tower', 'Ballupur'],
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    state: 'Punjab / Haryana',
    isPopular: true,
    hubs: ['Sector 17', 'Sector 35', 'Sector 22', 'Elante Mall'],
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    isPopular: true,
    hubs: ['Ranjit Avenue', 'Mall Road', 'Golden Temple Area'],
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Sanjay Place', 'Fatehabad Road', 'Tajganj', 'Kamla Nagar'],
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Assi Ghat', 'Lanka', 'Sigra', 'Cantt Railway Station'],
  },
  {
    id: 'kota',
    name: 'Kota',
    state: 'Rajasthan',
    isPopular: false,
    hubs: ['Vigyan Nagar', 'Talwandi', 'Mahaveer Nagar'],
  },
  {
    id: 'ranchi',
    name: 'Ranchi',
    state: 'Jharkhand',
    isPopular: false,
    hubs: ['Main Road', 'Lalpur', 'Harmu Housing Colony'],
  },
  {
    id: 'nagpur',
    name: 'Nagpur',
    state: 'Maharashtra',
    isPopular: false,
    hubs: ['Dharampeth', 'Sitabuldi', 'Wardha Road'],
  },
  {
    id: 'gwalior',
    name: 'Gwalior',
    state: 'Madhya Pradesh',
    isPopular: false,
    hubs: ['City Centre', 'Lashkar', 'Morar'],
  },
  {
    id: 'meerut',
    name: 'Meerut',
    state: 'Uttar Pradesh',
    isPopular: false,
    hubs: ['Abu Lane', 'Modipuram', 'Shastri Nagar'],
  },
];

export const DEFAULT_CITY: CityOption = POPULAR_CITIES[0]; // Lucknow
