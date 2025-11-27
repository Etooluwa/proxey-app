export const BookingStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

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

// All Provider Appointments (Upcoming, Past, Cancelled)
export const ALL_PROVIDER_APPOINTMENTS = [
    // Upcoming Appointments
    {
        id: 'apt1',
        clientName: 'Alice Cooper',
        clientAvatar: 'https://picsum.photos/seed/alice/100/100',
        service: 'Deep Home Cleaning',
        date: 'Oct 24, 2023',
        time: '09:00 AM - 11:00 AM',
        address: '456 Oak Lane, San Francisco',
        status: 'UPCOMING',
        price: 120.00,
        notes: 'Please pay attention to the master bathroom tiles. Gate code is #4455.',
        phone: '+1 (555) 123-4567'
    },
    {
        id: 'apt2',
        clientName: 'Bob Smith',
        clientAvatar: 'https://picsum.photos/seed/bob/100/100',
        service: 'Window Cleaning',
        date: 'Oct 24, 2023',
        time: '01:00 PM - 02:30 PM',
        address: '789 Pine St, San Francisco',
        status: 'UPCOMING',
        price: 85.00,
        notes: 'Backyard windows only.',
        phone: '+1 (555) 987-6543'
    },
    {
        id: 'apt3',
        clientName: 'Carol Danvers',
        clientAvatar: 'https://picsum.photos/seed/carol/100/100',
        service: 'Move-out Clean',
        date: 'Oct 25, 2023',
        time: '04:00 PM - 06:00 PM',
        address: '321 Elm St, San Francisco',
        status: 'UPCOMING',
        price: 250.00,
        notes: 'Apartment will be empty. Keys are with the doorman.',
        phone: '+1 (555) 555-5555'
    },
    {
        id: 'apt4',
        clientName: 'David Lee',
        clientAvatar: 'https://picsum.photos/seed/david/100/100',
        service: 'Carpet Shampooing',
        date: 'Oct 26, 2023',
        time: '10:00 AM - 12:00 PM',
        address: '567 Maple Ave, San Francisco',
        status: 'UPCOMING',
        price: 90.00,
        notes: 'Living room and two bedrooms.',
        phone: '+1 (555) 111-2222'
    },

    // Past Appointments
    {
        id: 'apt5',
        clientName: 'Emma Watson',
        clientAvatar: 'https://picsum.photos/seed/emma/100/100',
        service: 'Deep Home Cleaning',
        date: 'Oct 15, 2023',
        time: '09:00 AM - 11:00 AM',
        address: '123 Main St, San Francisco',
        status: 'COMPLETED',
        price: 120.00,
        notes: 'Regular monthly cleaning.',
        phone: '+1 (555) 333-4444'
    },
    {
        id: 'apt6',
        clientName: 'Frank Miller',
        clientAvatar: 'https://picsum.photos/seed/frank/100/100',
        service: 'Window Cleaning',
        date: 'Oct 12, 2023',
        time: '02:00 PM - 03:30 PM',
        address: '890 Broadway, San Francisco',
        status: 'COMPLETED',
        price: 85.00,
        notes: 'All windows, inside and out.',
        phone: '+1 (555) 555-6666'
    },
    {
        id: 'apt7',
        clientName: 'Grace Kelly',
        clientAvatar: 'https://picsum.photos/seed/grace/100/100',
        service: 'Move-out Clean',
        date: 'Oct 10, 2023',
        time: '10:00 AM - 02:00 PM',
        address: '234 Park Ave, San Francisco',
        status: 'COMPLETED',
        price: 250.00,
        notes: 'Full apartment deep clean.',
        phone: '+1 (555) 777-8888'
    },
    {
        id: 'apt8',
        clientName: 'Henry Ford',
        clientAvatar: 'https://picsum.photos/seed/henry/100/100',
        service: 'Carpet Shampooing',
        date: 'Oct 08, 2023',
        time: '11:00 AM - 01:00 PM',
        address: '678 Oak St, San Francisco',
        status: 'COMPLETED',
        price: 90.00,
        notes: 'Three bedrooms.',
        phone: '+1 (555) 999-0000'
    },
    {
        id: 'apt9',
        clientName: 'Ivy Chen',
        clientAvatar: 'https://picsum.photos/seed/ivy/100/100',
        service: 'Deep Home Cleaning',
        date: 'Oct 05, 2023',
        time: '09:00 AM - 11:00 AM',
        address: '456 Sunset Blvd, San Francisco',
        status: 'COMPLETED',
        price: 120.00,
        notes: 'Focus on kitchen and bathrooms.',
        phone: '+1 (555) 222-3333'
    },

    // Cancelled Appointments
    {
        id: 'apt10',
        clientName: 'Jack Ryan',
        clientAvatar: 'https://picsum.photos/seed/jack/100/100',
        service: 'Window Cleaning',
        date: 'Oct 20, 2023',
        time: '03:00 PM - 04:30 PM',
        address: '789 Hill St, San Francisco',
        status: 'CANCELLED',
        price: 85.00,
        notes: 'Client cancelled due to schedule conflict.',
        phone: '+1 (555) 444-5555'
    },
    {
        id: 'apt11',
        clientName: 'Kate Bishop',
        clientAvatar: 'https://picsum.photos/seed/kate/100/100',
        service: 'Deep Home Cleaning',
        date: 'Oct 18, 2023',
        time: '10:00 AM - 12:00 PM',
        address: '321 Valley Rd, San Francisco',
        status: 'CANCELLED',
        price: 120.00,
        notes: 'Cancelled by provider - emergency.',
        phone: '+1 (555) 666-7777'
    },
    {
        id: 'apt12',
        clientName: 'Leo Martinez',
        clientAvatar: 'https://picsum.photos/seed/leo/100/100',
        service: 'Move-out Clean',
        date: 'Oct 16, 2023',
        time: '01:00 PM - 05:00 PM',
        address: '567 River St, San Francisco',
        status: 'CANCELLED',
        price: 250.00,
        notes: 'Client found another service.',
        phone: '+1 (555) 888-9999'
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

// Pending Appointment Requests (waiting for provider acceptance/decline)
export const PENDING_APPOINTMENT_REQUESTS = [
    {
        id: 'req1',
        clientName: 'Emma Wilson',
        clientAvatar: 'https://picsum.photos/seed/emma/100/100',
        clientEmail: 'emma.wilson@email.com',
        clientPhone: '+1 (555) 234-5678',
        service: 'Deep Home Cleaning',
        requestedDate: 'Oct 27, 2023',
        requestedTime: '10:00 AM - 12:00 PM',
        address: '890 Birch Ave, San Francisco',
        price: 120.00,
        clientNotes: 'Would love to focus on the kitchen and living room areas.',
        requestedAt: '2023-10-24T14:30:00Z',
        status: 'PENDING'
    },
    {
        id: 'req2',
        clientName: 'Frank Miller',
        clientAvatar: 'https://picsum.photos/seed/frank/100/100',
        clientEmail: 'frank.miller@email.com',
        clientPhone: '+1 (555) 345-6789',
        service: 'Move-out Clean',
        requestedDate: 'Oct 28, 2023',
        requestedTime: '09:00 AM - 01:00 PM',
        address: '234 Cedar Ln, San Francisco',
        price: 250.00,
        clientNotes: 'Moving out by end of month. Need thorough cleaning.',
        requestedAt: '2023-10-24T15:45:00Z',
        status: 'PENDING'
    },
    {
        id: 'req3',
        clientName: 'Grace Lee',
        clientAvatar: 'https://picsum.photos/seed/grace/100/100',
        clientEmail: 'grace.lee@email.com',
        clientPhone: '+1 (555) 456-7890',
        service: 'Standard Weekly Clean',
        requestedDate: 'Oct 30, 2023',
        requestedTime: '02:00 PM - 04:00 PM',
        address: '567 Walnut St, San Francisco',
        price: 80.00,
        clientNotes: 'Recurring weekly service preferred.',
        requestedAt: '2023-10-24T16:20:00Z',
        status: 'PENDING'
    }
];

// Provider Promotions (visible to clients on public profiles)
export const PROVIDER_PROMOTIONS = [
    {
        id: 1,
        title: 'Summer Special Discount',
        promoCode: 'SUMMER20',
        discountType: 'percentage',
        discountValue: 20,
        applicableServices: ['Deep Home Cleaning'],
        expiresOn: '2024-08-31',
        isActive: true,
        usageCount: 12,
        description: 'Get 20% off on all deep cleaning services this summer!'
    },
    {
        id: 2,
        title: 'First Time Client Offer',
        promoCode: 'WELCOME50',
        discountType: 'fixed',
        discountValue: 50,
        applicableServices: ['All Services'],
        expiresOn: '2024-12-31',
        isActive: true,
        usageCount: 28,
        description: 'New clients get $50 off their first booking!'
    },
    {
        id: 3,
        title: 'Weekly Maintenance Bundle',
        promoCode: 'WEEKLY15',
        discountType: 'percentage',
        discountValue: 15,
        applicableServices: ['Standard Weekly Clean'],
        expiresOn: '2024-12-15',
        isActive: true,
        usageCount: 45,
        description: 'Subscribe to weekly cleaning and save 15%'
    }
];
