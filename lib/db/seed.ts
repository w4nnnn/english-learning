import { db } from '@/lib/db';
import { modules, moduleItems, users } from '@/lib/db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

// --- Sample Data from modul_belajar ---

const SAMPLE_MODULES = [
    {
        id: 'module-np-intro',
        title: 'Noun Phrase: Introduction',
        description: 'Pengertian dasar Noun Phrase (Frasa Kata Benda) dan komponen utamanya. Materi Inti 4.',
        iconKey: 'BookOpen',
        order: 1,
        isPublished: true,
    },
    {
        id: 'module-np-patterns',
        title: 'Noun Phrase: Patterns & Structure',
        description: 'Pola-pola Noun Phrase: Determiner + Noun, Adjective + Noun, dan kombinasinya.',
        iconKey: 'Sparkles',
        order: 2,
        isPublished: true,
    },
    {
        id: 'module-np-practice',
        title: 'Noun Phrase: Practice & Quiz',
        description: 'Latihan dan kuis untuk menguasai Noun Phrase. Guided practice & independent exercise.',
        iconKey: 'Target',
        order: 3,
        isPublished: true,
    },
    {
        id: 'module-np-video',
        title: 'Noun Phrase: Video Learning',
        description: 'Belajar Noun Phrase melalui video interaktif. Materi Inti 5.',
        iconKey: 'Trophy',
        order: 4,
        isPublished: true,
    },
];

const SAMPLE_MODULE_ITEMS = [
    // ========================================
    // MODULE 1: Introduction to Noun Phrase
    // ========================================
    {
        id: 'np-intro-header',
        moduleId: 'module-np-intro',
        type: 'header',
        order: 1,
        title: 'What is a Noun Phrase?',
    },
    {
        id: 'np-intro-material-1',
        moduleId: 'module-np-intro',
        type: 'material',
        order: 2,
        title: 'Pengertian Noun Phrase',
        content: `**Noun Phrase** adalah **kelompok kata yang memiliki kata benda (noun) sebagai inti (head)** dan dapat disertai oleh determiner, adjective, atau modifier lainnya.

📌 **Rumus Sederhana:**
\`\`\`
Determiner + Adjective + Noun
\`\`\`

**Contoh:**
- **A book** → Sebuah buku
- **The sun** → Matahari itu  
- **Some students** → Beberapa siswa

Noun Phrase adalah gabungan dua kata atau lebih yang berpusat pada satu **Noun (kata benda)**. Tujuannya adalah untuk menjelaskan kata benda tersebut agar lebih spesifik.

**Contoh Perbandingan:**
| Noun | Noun Phrase |
|------|-------------|
| Car (Mobil) | A red luxury car (Sebuah mobil mewah berwarna merah) |
| Book (Buku) | My old interesting book (Buku lama saya yang menarik) |`,
    },
    {
        id: 'np-intro-mc-1',
        moduleId: 'module-np-intro',
        type: 'multiple_choice',
        order: 3,
        question: 'Which of the following is a noun phrase?',
        options: [
            { id: 'a', label: 'run fast', isCorrect: false },
            { id: 'b', label: 'very quickly', isCorrect: false },
            { id: 'c', label: 'a big house', isCorrect: true },
            { id: 'd', label: 'is beautiful', isCorrect: false },
        ],
        correctAnswer: 'c',
        xpReward: 10,
    },
    {
        id: 'np-intro-mc-2',
        moduleId: 'module-np-intro',
        type: 'multiple_choice',
        order: 4,
        question: 'The phrase **"a red apple"** is a noun phrase because it has …',
        options: [
            { id: 'a', label: 'verb and noun', isCorrect: false },
            { id: 'b', label: 'adjective and noun', isCorrect: true },
            { id: 'c', label: 'adverb and verb', isCorrect: false },
            { id: 'd', label: 'noun and verb', isCorrect: false },
        ],
        correctAnswer: 'b',
        xpReward: 10,
    },
    {
        id: 'np-intro-mc-3',
        moduleId: 'module-np-intro',
        type: 'multiple_choice',
        order: 5,
        question: 'What is the **head noun** in "a small cat"?',
        options: [
            { id: 'a', label: 'a', isCorrect: false },
            { id: 'b', label: 'small', isCorrect: false },
            { id: 'c', label: 'cat', isCorrect: true },
            { id: 'd', label: 'a small', isCorrect: false },
        ],
        correctAnswer: 'c',
        xpReward: 10,
    },

    // ========================================
    // MODULE 2: Patterns & Structure
    // ========================================
    {
        id: 'np-patterns-header',
        moduleId: 'module-np-patterns',
        type: 'header',
        order: 1,
        title: 'Noun Phrase Patterns',
    },
    {
        id: 'np-patterns-material-1',
        moduleId: 'module-np-patterns',
        type: 'material',
        order: 2,
        title: 'Pola-pola Noun Phrase',
        content: `Untuk kelas 8, kita fokus pada pola yang paling sering digunakan:

## 1️⃣ Determiner + Noun
Ini adalah bentuk paling dasar menggunakan kata tunjuk atau jumlah.
- **A book** (Sebuah buku)
- **The sun** (Matahari itu)
- **Some students** (Beberapa siswa)

## 2️⃣ Adjective + Noun
Menggunakan kata sifat untuk menjelaskan ciri-ciri benda.
- **Beautiful flower** (Bunga yang indah)
- **Smart boy** (Anak laki-laki yang pintar)
- **Big house** (Rumah yang besar)

## 3️⃣ Determiner + Adjective + Noun
Ini adalah pola yang paling lengkap.
- **A diligent student** (Seorang siswa yang rajin)
- **An old man** (Seorang pria tua)
- **The big red car** (Mobil merah besar itu)

| Determiner | Adjective | Noun (Head) | Noun Phrase |
|------------|-----------|-------------|-------------|
| A | Blue | Bag | A blue bag |
| Two | Tall | Trees | Two tall trees |
| That | Expensive | Watch | That expensive watch |
| Many | Happy | Children | Many happy children |`,
    },
    {
        id: 'np-patterns-mc-1',
        moduleId: 'module-np-patterns',
        type: 'multiple_choice',
        order: 3,
        question: 'Which is the **correct** noun phrase?',
        options: [
            { id: 'a', label: 'big the house', isCorrect: false },
            { id: 'b', label: 'the big house', isCorrect: true },
            { id: 'c', label: 'house big the', isCorrect: false },
            { id: 'd', label: 'big house the', isCorrect: false },
        ],
        correctAnswer: 'b',
        xpReward: 15,
    },
    {
        id: 'np-patterns-mc-2',
        moduleId: 'module-np-patterns',
        type: 'multiple_choice',
        order: 4,
        question: '"Those smart students" consists of …',
        options: [
            { id: 'a', label: 'noun + adjective', isCorrect: false },
            { id: 'b', label: 'adjective + verb', isCorrect: false },
            { id: 'c', label: 'determiner + adjective + noun', isCorrect: true },
            { id: 'd', label: 'noun + verb', isCorrect: false },
        ],
        correctAnswer: 'c',
        xpReward: 15,
    },
    {
        id: 'np-patterns-arrange-1',
        moduleId: 'module-np-patterns',
        type: 'arrange_words',
        order: 5,
        question: 'Arrange the words into a correct noun phrase: **(the – cat – black)**',
        options: ['the', 'cat', 'black'],
        correctAnswer: 'the black cat',
        xpReward: 15,
    },
    {
        id: 'np-patterns-arrange-2',
        moduleId: 'module-np-patterns',
        type: 'arrange_words',
        order: 6,
        question: 'Arrange the words correctly: **(my – bag – new)**',
        options: ['my', 'bag', 'new'],
        correctAnswer: 'my new bag',
        xpReward: 15,
    },
    {
        id: 'np-patterns-mc-3',
        moduleId: 'module-np-patterns',
        type: 'multiple_choice',
        order: 7,
        question: 'Which noun phrase is **NOT** correct?',
        options: [
            { id: 'a', label: 'a small dog', isCorrect: false },
            { id: 'b', label: 'the old man', isCorrect: false },
            { id: 'c', label: 'old the man', isCorrect: true },
            { id: 'd', label: 'my new shoes', isCorrect: false },
        ],
        correctAnswer: 'c',
        xpReward: 15,
    },

    // ========================================
    // MODULE 3: Practice & Quiz
    // ========================================
    {
        id: 'np-practice-header',
        moduleId: 'module-np-practice',
        type: 'header',
        order: 1,
        title: 'Practice Time!',
    },
    {
        id: 'np-practice-material',
        moduleId: 'module-np-practice',
        type: 'material',
        order: 2,
        title: 'Guided Practice Instructions',
        content: `🎯 **Let's Practice!**

In this section, you will:
1. Answer multiple choice questions
2. Arrange words into correct noun phrases
3. Apply noun phrases in sentences

💡 **Tips:**
- Remember the order: **Determiner → Adjective → Noun**
- For multiple adjectives: **Size → Color → Noun**
- Don't worry about mistakes - you can try many times!

✨ **Example:**
- Correct: "a big red apple" ✅
- Wrong: "a red big apple" ❌

Ready? Let's go! 🚀`,
    },
    {
        id: 'np-practice-mc-1',
        moduleId: 'module-np-practice',
        type: 'multiple_choice',
        order: 3,
        question: 'I have ____.',
        options: [
            { id: 'a', label: 'read book', isCorrect: false },
            { id: 'b', label: 'a new bag', isCorrect: true },
            { id: 'c', label: 'very happy', isCorrect: false },
            { id: 'd', label: 'run fast', isCorrect: false },
        ],
        correctAnswer: 'b',
        xpReward: 10,
    },
    {
        id: 'np-practice-mc-2',
        moduleId: 'module-np-practice',
        type: 'multiple_choice',
        order: 4,
        question: 'She buys ____.',
        options: [
            { id: 'a', label: 'two pencils', isCorrect: true },
            { id: 'b', label: 'write letter', isCorrect: false },
            { id: 'c', label: 'very quickly', isCorrect: false },
            { id: 'd', label: 'sing loudly', isCorrect: false },
        ],
        correctAnswer: 'a',
        xpReward: 10,
    },
    {
        id: 'np-practice-arrange-1',
        moduleId: 'module-np-practice',
        type: 'arrange_words',
        order: 5,
        question: 'Arrange into a noun phrase: **(bag – school – my)**',
        options: ['bag', 'school', 'my'],
        correctAnswer: 'my school bag',
        xpReward: 15,
    },
    {
        id: 'np-practice-arrange-2',
        moduleId: 'module-np-practice',
        type: 'arrange_words',
        order: 6,
        question: 'Arrange into a noun phrase: **(dress – beautiful – a)**',
        options: ['dress', 'beautiful', 'a'],
        correctAnswer: 'a beautiful dress',
        xpReward: 15,
    },
    {
        id: 'np-practice-mc-3',
        moduleId: 'module-np-practice',
        type: 'multiple_choice',
        order: 7,
        question: 'She has ____ in her room.',
        options: [
            { id: 'a', label: 'a beautiful mirror', isCorrect: true },
            { id: 'b', label: 'mirror beautiful', isCorrect: false },
            { id: 'c', label: 'beautiful mirror a', isCorrect: false },
            { id: 'd', label: 'mirror a beautiful', isCorrect: false },
        ],
        correctAnswer: 'a',
        xpReward: 10,
    },
    {
        id: 'np-practice-mc-4',
        moduleId: 'module-np-practice',
        type: 'multiple_choice',
        order: 8,
        question: 'They see ____ in the zoo.',
        options: [
            { id: 'a', label: 'two big elephants', isCorrect: true },
            { id: 'b', label: 'big two elephants', isCorrect: false },
            { id: 'c', label: 'elephants big two', isCorrect: false },
            { id: 'd', label: 'two elephants big', isCorrect: false },
        ],
        correctAnswer: 'a',
        xpReward: 10,
    },
    {
        id: 'np-practice-mc-5',
        moduleId: 'module-np-practice',
        type: 'multiple_choice',
        order: 9,
        question: 'Which is the correct noun phrase (Order of Adjectives)?',
        options: [
            { id: 'a', label: 'red two big apples', isCorrect: false },
            { id: 'b', label: 'two big red apples', isCorrect: true },
            { id: 'c', label: 'big red two apples', isCorrect: false },
            { id: 'd', label: 'apples red big two', isCorrect: false },
        ],
        correctAnswer: 'b',
        xpReward: 20,
    },
    {
        id: 'np-practice-arrange-3',
        moduleId: 'module-np-practice',
        type: 'arrange_words',
        order: 10,
        question: 'Complex Noun Phrase: **(a – brown – small – bag)**',
        options: ['a', 'brown', 'small', 'bag'],
        correctAnswer: 'a small brown bag',
        xpReward: 25,
    },
    {
        id: 'np-practice-arrange-4',
        moduleId: 'module-np-practice',
        type: 'arrange_words',
        order: 11,
        question: 'Complex Noun Phrase: **(those – white – big – houses)**',
        options: ['those', 'white', 'big', 'houses'],
        correctAnswer: 'those big white houses',
        xpReward: 25,
    },

    // ========================================
    // MODULE 4: Video Learning (Materi Inti 5)
    // ========================================
    {
        id: 'np-video-header',
        moduleId: 'module-np-video',
        type: 'header',
        order: 1,
        title: 'Video Pembelajaran',
    },
    {
        id: 'np-video-material',
        moduleId: 'module-np-video',
        type: 'material',
        order: 2,
        title: 'Watch and Learn',
        content: `🎬 **Video: Understanding Noun Phrase**

Watch this short video to understand what a noun phrase is and how to use it correctly.

📺 **Video Link:** [Noun Phrase Explanation](https://youtu.be/FgygaJjMUnE?si=OyYWFuWPryeel4_h)

⏱️ **Duration:** Approximately 2-3 minutes

After watching the video, you will:
1. Understand what a noun phrase is
2. Know the basic structure
3. Be able to identify noun phrases in sentences

💬 **Hi students! 🎉**
Let's watch a short video to understand what a *noun phrase* is and how to use it.`,
    },
    {
        id: 'np-video-mc-1',
        moduleId: 'module-np-video',
        type: 'multiple_choice',
        order: 3,
        question: 'After watching the video, "My three old books" shows …',
        options: [
            { id: 'a', label: 'simple noun phrase', isCorrect: false },
            { id: 'b', label: 'verb phrase', isCorrect: false },
            { id: 'c', label: 'complex noun phrase', isCorrect: true },
            { id: 'd', label: 'adjective phrase', isCorrect: false },
        ],
        correctAnswer: 'c',
        xpReward: 15,
    },
    {
        id: 'np-video-mc-2',
        moduleId: 'module-np-video',
        type: 'multiple_choice',
        order: 4,
        question: 'The head noun in "those beautiful flowers" is …',
        options: [
            { id: 'a', label: 'those', isCorrect: false },
            { id: 'b', label: 'beautiful', isCorrect: false },
            { id: 'c', label: 'flowers', isCorrect: true },
            { id: 'd', label: 'those beautiful', isCorrect: false },
        ],
        correctAnswer: 'c',
        xpReward: 15,
    },
    {
        id: 'np-video-mc-3',
        moduleId: 'module-np-video',
        type: 'multiple_choice',
        order: 5,
        question: 'Which sentence uses noun phrase correctly?',
        options: [
            { id: 'a', label: 'She has bag red big', isCorrect: false },
            { id: 'b', label: 'She has a big red bag', isCorrect: true },
            { id: 'c', label: 'She has red a big bag', isCorrect: false },
            { id: 'd', label: 'She has big bag red', isCorrect: false },
        ],
        correctAnswer: 'b',
        xpReward: 20,
    },
    {
        id: 'np-video-mc-4',
        moduleId: 'module-np-video',
        type: 'multiple_choice',
        order: 6,
        question: 'Which is NOT a noun phrase?',
        options: [
            { id: 'a', label: 'a tall tree', isCorrect: false },
            { id: 'b', label: 'the old house', isCorrect: false },
            { id: 'c', label: 'run fast', isCorrect: true },
            { id: 'd', label: 'those smart students', isCorrect: false },
        ],
        correctAnswer: 'c',
        xpReward: 10,
    },
    {
        id: 'np-video-material-closing',
        moduleId: 'module-np-video',
        type: 'material',
        order: 7,
        title: 'Congratulations!',
        content: `🎉 **Great job!**

You have learned noun phrases with:
- ✅ Text explanations
- ✅ Interactive exercises
- ✅ Video content

💬 **Keep practicing!**

Remember:
- Noun Phrase = Determiner + Adjective + Noun
- The **head noun** is the main word
- Adjective order matters: Size → Color → Noun

**Thank you for learning with me today. See you next time!** 👋`,
    },
];

// --- Seed Functions ---

export async function seedUsers() {
    console.log('🌱 Seeding users...');

    const defaultUsers = [
        {
            id: 'user-admin',
            username: 'admin',
            password: 'admin123',
            role: 'admin' as const,
        },
        {
            id: 'user-guru',
            username: 'guru',
            password: 'guru123',
            role: 'guru' as const,
        },
        {
            id: 'user-murid',
            username: 'murid',
            password: 'murid123',
            role: 'murid' as const,
        },
    ];

    for (const userData of defaultUsers) {
        const existing = await db.select().from(users).where(eq(users.username, userData.username)).get();

        if (existing) {
            console.log(`⏭️  User "${userData.username}" already exists, updating role...`);
            await db.update(users)
                .set({ role: userData.role })
                .where(eq(users.id, existing.id));
        } else {
            const passwordHash = await hash(userData.password, 10);
            await db.insert(users).values({
                id: userData.id,
                username: userData.username,
                passwordHash,
                role: userData.role,
                heartCount: 5,
                xp: userData.role === 'admin' ? 100 : 0,
                streak: userData.role === 'admin' ? 1 : 0,
            });
            console.log(`✅ Created user "${userData.username}" with role "${userData.role}"`);
        }
    }

    console.log('\n📋 Default credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  Guru:  guru / guru123');
    console.log('  Murid: murid / murid123');
}

export async function seedModules() {
    console.log('Seeding modules from modul_belajar...');

    // Clear existing data
    await db.delete(moduleItems);
    await db.delete(modules);

    // Insert modules
    await db.insert(modules).values(SAMPLE_MODULES);
    console.log(`Seeded ${SAMPLE_MODULES.length} modules.`);

    // Insert module items
    await db.insert(moduleItems).values(SAMPLE_MODULE_ITEMS);
    console.log(`Seeded ${SAMPLE_MODULE_ITEMS.length} module items.`);
}

// Backward compatibility
export async function seedLessons() {
    await seedModules();
}

// --- Main Execution ---

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    (async () => {
        try {
            console.log('Starting database seed...');
            await seedUsers();
            await seedModules();
            console.log('Database seeding completed successfully.');
            process.exit(0);
        } catch (error) {
            console.error('Database seeding failed:', error);
            process.exit(1);
        }
    })();
}
