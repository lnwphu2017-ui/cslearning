// Test all API endpoints
const BASE = "http://localhost:5000";

async function testEndpoint(name, url, body) {
    console.log(`\n--- Testing: ${name} ---`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        console.log(`  Status: ${res.status}`);
        if (res.ok) {
            console.log(`  ✅ SUCCESS`);
            // Show brief summary
            if (data.reply) console.log(`  Reply length: ${data.reply.content.length} chars`);
            if (data.questions) console.log(`  Questions: ${data.questions.length}`);
            if (data.cards) console.log(`  Cards: ${data.cards.length}`);
            if (data.summary) console.log(`  Summary length: ${data.summary.length} chars`);
        } else {
            console.log(`  ❌ FAILED: ${JSON.stringify(data)}`);
        }
        return { name, ok: res.ok, status: res.status };
    } catch (err) {
        console.log(`  ❌ ERROR: ${err.message}`);
        return { name, ok: false, error: err.message };
    }
}

async function main() {
    console.log("=== API ENDPOINT TESTS ===\n");

    // 1. Test Chat API
    const r1 = await testEndpoint("Chat API", `${BASE}/api/chat`, {
        messages: [{ role: "user", content: "Linked List คืออะไร?" }]
    });

    // 2. Test Quiz Generation
    const r2 = await testEndpoint("Quiz Generation", `${BASE}/api/generate-quiz`, {
        chapterTitle: "Linked Lists"
    });

    // 3. Test Flashcard Generation
    const r3 = await testEndpoint("Flashcard Generation", `${BASE}/api/generate-flashcards`, {
        chapterTitle: "Stacks & Queues"
    });

    // 4. Test Exam Generation
    const r4 = await testEndpoint("Exam Generation", `${BASE}/api/generate-exam`, {
        chapterTitles: ["Linked Lists", "Stacks & Queues", "Binary Trees"]
    });

    // 5. Test PDF Summary
    const r5 = await testEndpoint("PDF Summary", `${BASE}/api/generate-pdf-summary`, {
        quizScores: [{ chapterIdx: 0, title: "Linked Lists", score: 8, total: 10 }],
        examResults: { score: 25, total: 30, timeSpent: "15:30" },
        radarScores: { Remember: 80, Understand: 70, Apply: 60, Analyze: 50, Evaluate: 40, Create: 30 }
    });

    // Summary
    const results = [r1, r2, r3, r4, r5];
    console.log("\n\n=== SUMMARY ===");
    results.forEach(r => {
        console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.ok ? 'PASS' : 'FAIL'}`);
    });
    const passed = results.filter(r => r.ok).length;
    console.log(`\n  Total: ${passed}/${results.length} passed`);
}

main();
