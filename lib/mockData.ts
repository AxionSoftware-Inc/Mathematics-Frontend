export const courses = [
    {
        id: "quantum-computing-101",
        title: "Kvant Hisoblash Asoslari",
        description: "Kvant mexanikasi va kvant algoritmlariga kirish",
        level: "Boshlang'ich",
        duration: "4 hafta",
        instructor: "Dr. Alisher Vohidov",
        thumbnail: "/images/courses/quantum-101.jpg",
        tags: ["Physics", "Computing"],
        modules: [
            {
                id: "module-1",
                title: "Kubitlar va Superpozitsiya",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video
                duration: "45 min",
            },
            // ... more modules
        ],
    },
    {
        id: "advanced-ai",
        title: "Sun'iy Intellekt va Neyron Tarmoqlar",
        description: "Deep learning va mashinali o'qitish chuqurlashtirilgan kursi",
        level: "Ilg'or",
        duration: "8 hafta",
        instructor: "Prof. Malika Karimova",
        thumbnail: "/images/courses/ai-advanced.jpg",
        tags: ["AI", "Computer Science"],
        modules: [],
    }
];

export const scientificPapers = [
    {
        id: "doi-10-1234-5678",
        title: "O'zbekistonda Kvant Kriptografiyasining Kelajagi",
        authors: ["A. Vohidov", "M. Karimova"],
        publishedDate: "2024-05-12",
        abstract: "Ushbu maqolada kvant kriptografiyasining amaliy tadbiqlari...",
        readTime: "12 min",
        category: "Quantum Mechanics",
    },
    {
        id: "doi-10-8765-4321",
        title: "Yangi avlod quyosh panellarida nanomateriallar",
        authors: ["B. Rustamov"],
        publishedDate: "2024-06-20",
        abstract: "Nanotexnologiyalar yordamida quyosh energiyasi samaradorligini...",
        readTime: "8 min",
        category: "Nanotechnology",
    }
];
