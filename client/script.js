document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const clearBtn = document.getElementById("clear-btn");

  // Endpoint API Express lokal Anda
  const API_URL = "http://localhost:3000/api/chat";

  // get riwayat chat sebelumnya dari LocalStorage
  let conversation = JSON.parse(localStorage.getItem("astrobot_history")) || [];

  // render chat history jika sudah ada sesi tersimpan
  conversation.forEach((msg) => {
    // Map role struktur API backend ('user'/'model') ke format UI render
    const sender = msg.role === "user" ? "user" : "bot";
    appendMessage(sender, msg.text);
  });
  scrollToBottom();

  // Submit chat
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    // reply pesan user ke layar UI
    appendMessage("user", userMessage);
    input.value = "";
    scrollToBottom();

    // Input pesan user ke dalam array memori state percakapan
    conversation.push({ role: "user", text: userMessage });
    saveToLocalStorage();

    // Tampilkan placeholder loading respon bot
    const loadingId = appendMessage(
      "bot",
      "Astrobot sedang menganalisis gejala...",
    );
    scrollToBottom();

    try {
      // Call API backend
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation: conversation }),
      });

      const data = await response.json();

      // Hapus element teks loading placeholder
      document.getElementById(loadingId)?.remove();

      if (data.success) {
        // Tampilkan respon teks asli hasil olahan Gemini
        appendMessage("bot", data.result);
        // Masukkan respon asisten ke array percakapan dengan role 'model' sesuai SDK Gemini baru
        conversation.push({ role: "model", text: data.result });
        saveToLocalStorage();
      } else {
        appendMessage("bot", `Terjadi kendala: ${data.error}`);
      }
    } catch (error) {
      document.getElementById(loadingId)?.remove();
      appendMessage(
        "bot",
        "Gagal terhubung ke server backend. Pastikan aplikasi Express Anda sudah dijalankan.",
      );
      console.error("Integrasi Error:", error);
    }

    scrollToBottom();
  });

  // Button hapus
  clearBtn.addEventListener("click", () => {
    if (confirm("Apakah Anda ingin menghapus seluruh riwayat obrolan?")) {
      localStorage.removeItem("astrobot_history");
      conversation = [];
      // Refresh tampilan tersisa hanya balasan pembuka default
      location.reload();
    }
  });

  // Function Style balon Chat Modern ala ala whatsapp haha
  function appendMessage(sender, text) {
    const id = "msg-" + Math.floor(Math.random() * 1000000);
    const isUser = sender === "user";
    const isError = sender === "error";

    const msgDiv = document.createElement("div");
    msgDiv.id = id;

    if (isUser) {
      msgDiv.className = "message user";
    } else if (isError) {
      msgDiv.className = "message error-msg"; 
    } else {
      msgDiv.className = "message bot";
    }

    msgDiv.innerHTML = `
        <div class="avatar">${isUser ? "👤" : isError ? "⚠️" : "🤖"}</div>
        <div class="msg-content">
            <p class="sender-name">${isUser ? "Anda" : isError ? "Sistem Error" : "Astrobot"}</p>
            <p class="msg-text">${text}</p>
        </div>
    `;

    chatBox.appendChild(msgDiv);
    return id;
  }

  function saveToLocalStorage() {
    localStorage.setItem("astrobot_history", JSON.stringify(conversation));
  }

  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
