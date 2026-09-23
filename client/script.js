document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const clearBtn = document.getElementById("clear-btn");
  const sendBtn = form.querySelector(".btn-send");

  // Endpoint API
  const API_URL = "http://localhost:3000/api/chat";

  // get riwayat chat sebelumnya dari LocalStorage
  let conversation = JSON.parse(localStorage.getItem("Edison_history")) || [];

  // render chat history jika sudah ada sesi tersimpan
  conversation.forEach((msg) => {
    // Map role struktur API backend ('user'/'model') ke format UI render
    const sender = msg.role === "user" ? "user" : "bot";
    appendMessage(sender, msg.text);
  });
  scrollToBottom();

  function toggleSendButton() {
    if (input.value.trim() === "") {
      sendBtn.disabled = true;
      sendBtn.classList.add("disabled"); // disable jika inputan kosong
    } else {
      sendBtn.disabled = false;
      sendBtn.classList.remove("disabled");
    }
  }

  // jalankan function toggle button
  toggleSendButton();

  // cek jika user mengetik dan menghapus inputan, maka toggle button nya di panggil
  input.addEventListener("input", toggleSendButton);

  // Submit chat
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    // reply pesan user
    const lastUserQuestionId = appendMessage("user", userMessage);
    input.value = "";

    toggleSendButton(); // non aktifkan kembali button kirim jika sudah mengirim chat
    scrollToLastQuestion(lastUserQuestionId);

    // Input pesan user ke dalam array memori state percakapan
    conversation.push({ role: "user", text: userMessage });
    saveToLocalStorage();

    // Tampilkan placeholder loading respon bot
    const loadingId = appendMessage(
      "bot",
      "EDISON sedang menganalisis gejala...",
    );

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
        // Tampilkan respon teks asli hasil dari Gemini
        appendMessage("bot", data.result);
        // Masukkan respon chat ke array percakapan dengan role 'model'
        conversation.push({ role: "model", text: data.result });
        saveToLocalStorage();
        scrollToLastQuestion(lastUserQuestionId);
      } else {
        appendMessage("bot", `Terjadi kendala: ${data.error}`);
      }
    } catch (error) {
      document.getElementById(loadingId)?.remove();
      appendMessage(
        "bot",
        "Terjadi kesalahan, silahkan coba lagi nanti.",
      );
      console.error("Terjadi Error:", error);
    }
  });

  // Button hapus
  clearBtn.addEventListener("click", () => {
    if (confirm("Apakah Anda ingin menghapus seluruh riwayat obrolan?")) {
      localStorage.removeItem("Edison_history");
      conversation = [];
      // Refresh tampilan, cuma sisakan defualt message
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
            <p class="sender-name">${isUser ? "Anda" : isError ? "Sistem Error" : "EDISON"}</p>
            <p class="msg-text">${text}</p>
        </div>
    `;

    chatBox.appendChild(msgDiv);
    return id;
  }

  function saveToLocalStorage() {
    localStorage.setItem("Edison_history", JSON.stringify(conversation));
  }

  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function scrollToLastQuestion(elementId) {
    setTimeout(() => {
      const lastQuestionElement = document.getElementById(elementId);
      if (lastQuestionElement) {
        lastQuestionElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  }
});
