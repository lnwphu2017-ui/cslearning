// Test Exam API with longer timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes

console.log("--- Testing Exam Generation (5 min timeout) ---");
console.log("Sending request...");

try {
    const res = await fetch("http://localhost:5000/api/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterTitles: ["Linked Lists", "Stacks & Queues", "Binary Trees"] }),
        signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    if (data.questions) {
        console.log(`✅ SUCCESS - ${data.questions.length} questions generated`);
        // Verify structure
        const q = data.questions[0];
        console.log(`  Sample Q: ${q.question.substring(0, 60)}...`);
        console.log(`  Options: ${q.options.length}`);
        console.log(`  CorrectIndex: ${q.correctIndex}`);
        console.log(`  Domain: ${q.domain}`);
        console.log(`  Chapter: ${q.chapterTitle}`);
    } else {
        console.log(`❌ FAILED: ${JSON.stringify(data)}`);
    }
} catch (err) {
    clearTimeout(timeout);
    console.log(`❌ ERROR: ${err.message}`);
}
