(function () {
  const accessForm = document.getElementById("access-form");
  const form = document.getElementById("flexlink-form");
  const accessMessage = document.getElementById("access-message");
  const message = document.getElementById("form-message");
  const fields = Array.from(document.querySelectorAll(".line-answer"));

  function resizeField(field) {
    field.style.height = "auto";
    field.style.height = `${Math.max(field.scrollHeight, field.offsetHeight)}px`;
  }

  fields.forEach((field) => {
    resizeField(field);
    field.addEventListener("input", () => resizeField(field));
  });

  function setMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type || ""}`.trim();
  }

  function setAccessMessage(text, type) {
    accessMessage.textContent = text;
    accessMessage.className = `message ${type || ""}`.trim();
  }

  function unlockForm() {
    accessForm.classList.add("is-hidden");
    form.classList.remove("is-hidden");
  }

  accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = accessForm.querySelector("button[type='submit']");
    const data = Object.fromEntries(new FormData(accessForm).entries());

    submitButton.disabled = true;
    setAccessMessage("Checking...", "");

    try {
      const response = await fetch("/api/flexlink-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          pin: String(data.pin || "").trim()
        })
      });

      if (!response.ok) throw new Error("Access denied");

      setAccessMessage("", "");
      unlockForm();
    } catch (error) {
      console.error(error);
      setAccessMessage("Access code not recognized.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.website) return;

    submitButton.disabled = true;
    setMessage("Saving...", "");

    try {
      const response = await fetch("/api/flexlink-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.name || "").trim(),
          title: String(data.title || "").trim(),
          jobDescription: String(data.jobDescription || "").trim(),
          changeReasons: String(data.changeReasons || "").trim()
        })
      });

      if (!response.ok) throw new Error("Save failed");

      setMessage("Thank you. Your notes have been received.", "success");
      form.reset();
      fields.forEach((field) => resizeField(field));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      setMessage("Could not save. Please try again, or send your notes directly to Evan.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
})();
