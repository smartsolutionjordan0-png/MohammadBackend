const http = require("http");

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.method !== "POST" || req.url !== "/chat") {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Not found" }));
    }

    let body = "";

    req.on("data", chunk => {
        body += chunk;
    });

    req.on("end", async () => {
        try {
            const { message } = JSON.parse(body);

            if (!message) {
                res.statusCode = 400;
                return res.end(JSON.stringify({
                    error: "الرسالة مطلوبة"
                }));
            }

            const response = await fetch(
                "https://api.openai.com/v1/responses",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-5-mini",
                        instructions:
                            "أنت محمد، مساعد شخصي ذكي. تحدث بالعربية بشكل واضح ومختصر ومفيد.",
                        input: message
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                res.statusCode = response.status;
                return res.end(JSON.stringify({
                    error: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي",
                    details: data
                }));
            }

            const reply =
                data.output
                    ?.flatMap(item => item.content || [])
                    ?.find(item => item.type === "output_text")
                    ?.text || "لم أتمكن من إنشاء رد.";

            res.end(JSON.stringify({ reply }));

        } catch (error) {
            console.error(error);

            res.statusCode = 500;
            res.end(JSON.stringify({
                error: "حدث خطأ في الخادم"
            }));
        }
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Mohammad Backend running on port ${PORT}`);
});