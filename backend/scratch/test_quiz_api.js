async function testQuiz() {
    console.log("Testing Quiz API...");
    try {
        const response = await fetch("http://localhost:5000/api/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterTitle: "Stacks & Queues" }),
        });
        
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Raw Response Content-Type:", response.headers.get("content-type"));
        console.log("Raw Response:", text);
        try {
            const data = JSON.parse(text);
            console.log("Parsed Data:", JSON.stringify(data, null, 2).substring(0, 500) + "...");
        } catch (e) {
            console.log("Response is not JSON");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testQuiz();
