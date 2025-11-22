export const CATEGORIES = [
    { id: '1', name: 'Cleaning', icon: 'Sparkles', color: 'bg-blue-100 text-blue-600' },
    { id: '2', name: 'Repair', icon: 'Wrench', color: 'bg-orange-100 text-orange-600' },
    { id: '3', name: 'Beauty', icon: 'Scissors', color: 'bg-pink-100 text-pink-600' },
    { id: '4', name: 'Moving', icon: 'Truck', color: 'bg-green-100 text-green-600' },
    { id: '5', name: 'Painting', icon: 'Paintbrush', color: 'bg-purple-100 text-purple-600' },
    { id: '6', name: 'Plumbing', icon: 'Droplets', color: 'bg-cyan-100 text-cyan-600' },
    { id: '7', name: 'Electrical', icon: 'Zap', color: 'bg-yellow-100 text-yellow-600' },
    { id: '8', name: 'Gardening', icon: 'Leaf', color: 'bg-emerald-100 text-emerald-600' },
    { id: '9', name: 'Pet Care', icon: 'PawPrint', color: 'bg-rose-100 text-rose-600' },
    { id: '10', name: 'Photography', icon: 'Camera', color: 'bg-indigo-100 text-indigo-600' },
];

// Shared Service Data Source
export const PROVIDER_SERVICES = [
    // Cleaning Services (Jane Doe)
    {
        id: '1',
        title: 'Deep Home Cleaning',
        category: 'Cleaning',
        price: 60,
        priceUnit: 'hour',
        duration: '2-4 hours',
        description: 'Complete cleaning including floors, dusting, kitchen, and bathrooms. Best for monthly upkeep.',
        active: true,
        bookingsCount: 24
    },
    {
        id: '2',
        title: 'Move-out Clean',
        category: 'Cleaning',
        price: 250,
        priceUnit: 'fixed',
        duration: '4-6 hours',
        description: 'Intensive cleaning for empty apartments. Guarantee your deposit back.',
        active: true,
        bookingsCount: 8
    },
    {
        id: '3',
        title: 'Carpet Shampooing',
        category: 'Cleaning',
        price: 45,
        priceUnit: 'hour',
        duration: '1-2 hours',
        description: 'Professional steam cleaning for carpets and rugs.',
        active: false,
        bookingsCount: 0
    },
    {
        id: '4',
        title: 'Standard Weekly Clean',
        category: 'Cleaning',
        price: 40,
        priceUnit: 'hour',
        duration: '2 hours',
        description: 'Regular maintenance cleaning for busy households.',
        active: true,
        bookingsCount: 56
    },
    // Plumbing Services (Mike Ross)
    {
        id: '5',
        title: 'Leak Repair',
        category: 'Plumbing',
        price: 85,
        priceUnit: 'hour',
        duration: '1 hour',
        description: 'Fixing leaks in pipes, faucets, or toilets.',
        active: true,
        bookingsCount: 15
    },
    {
        id: '6',
        title: 'Pipe Installation',
        category: 'Plumbing',
        price: 120,
        priceUnit: 'hour',
        duration: '2-4 hours',
        description: 'Installation of new piping systems.',
        active: true,
        bookingsCount: 5
    },
    // Moving Services (Elite Movers)
    {
        id: '7',
        title: 'Local Move (Studio)',
        category: 'Moving',
        price: 120,
        priceUnit: 'hour',
        duration: '3-5 hours',
        description: '2 movers and a truck for studio apartments.',
        active: true,
        bookingsCount: 42
    },
    // Painting (Jessica Pearson)
    {
        id: '8',
        title: 'Room Painting',
        category: 'Painting',
        price: 300,
        priceUnit: 'fixed',
        duration: '1 day',
        description: 'Walls and trim for a standard 12x12 room.',
        active: true,
        bookingsCount: 12
    }
];

// Mock Providers
export const TOP_PROVIDERS = [
    {
        id: 'p1',
        name: 'Sarah Jenkins',
        title: 'Professional Home Cleaner',
        rating: 4.9,
        reviewCount: 128,
        avatarUrl: 'https://picsum.photos/seed/sarah/200/200',
        hourlyRate: 35,
        categories: ['Cleaning', 'Organization'],
        location: 'San Francisco, CA',
        isOnline: true
    },
    {
        id: 'p2',
        name: 'Mike Ross',
        title: 'Certified Plumber & Handyman',
        rating: 4.8,
        reviewCount: 94,
        avatarUrl: 'https://picsum.photos/seed/mike/200/200',
        hourlyRate: 85,
        categories: ['Plumbing', 'Repair', 'Electrical'],
        location: 'Daly City, CA',
        isOnline: false
    },
    {
        id: 'p3',
        name: 'Elite Movers Inc.',
        title: 'Full Service Moving Company',
        rating: 4.7,
        reviewCount: 215,
        avatarUrl: 'https://picsum.photos/seed/movers/200/200',
        hourlyRate: 120,
        categories: ['Moving'],
        location: 'Oakland, CA',
        isOnline: true
    },
    {
        id: 'p4',
        name: 'Jessica Pearson',
        title: 'Interior Painter',
        rating: 5.0,
        reviewCount: 42,
        avatarUrl: 'https://picsum.photos/seed/jessica/200/200',
        hourlyRate: 65,
        categories: ['Painting', 'Decor'],
        location: 'San Francisco, CA',
        isOnline: false
    },
    {
        id: 'p5',
        name: 'David Green',
        title: 'Landscape Architect',
        rating: 4.6,
        reviewCount: 30,
        avatarUrl: 'https://picsum.photos/seed/david/200/200',
        hourlyRate: 75,
        categories: ['Gardening', 'Design'],
        location: 'San Jose, CA',
        isOnline: true
    },
    {
        id: 'p6',
        name: 'Annie Leibovitz',
        title: 'Event Photographer',
        rating: 4.9,
        reviewCount: 88,
        avatarUrl: 'https://picsum.photos/seed/annie/200/200',
        hourlyRate: 150,
        categories: ['Photography', 'Events'],
        location: 'San Francisco, CA',
        isOnline: false
    }
];

// Empty state: No bookings yet
export const CLIENT_BOOKINGS = [];

// Mock requests for provider view
export const PROVIDER_REQUESTS = [
    {
        id: 'req1',
        serviceName: 'Deep Home Cleaning',
        providerName: 'Jane Doe',
        providerAvatar: 'https://picsum.photos/seed/jane/100/100',
        clientName: 'Michael Scott',
        clientAvatar: 'https://picsum.photos/seed/michael/100/100',
        date: 'Oct 26, 2023',
        time: '10:00 AM',
        status: BookingStatus.PENDING,
        price: 120,
        location: '1725 Slough Ave, Scranton'
    },
    {
        id: 'req2',
        serviceName: 'Window Cleaning',
        providerName: 'Jane Doe',
        providerAvatar: 'https://picsum.photos/seed/jane/100/100',
        clientName: 'Pam Beesly',
        clientAvatar: 'https://picsum.photos/seed/pam/100/100',
        date: 'Oct 27, 2023',
        time: '02:00 PM',
        status: BookingStatus.PENDING,
        price: 85,
        location: '45 Beesly St, Scranton'
    }
];

// Empty state: No earnings yet
export const EARNINGS_DATA = [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: 0 },
];

export const BookingStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};
