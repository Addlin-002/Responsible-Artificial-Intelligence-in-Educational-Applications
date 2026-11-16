
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        const message = document.getElementById("registerMessage");
        const submitButton = registerForm.querySelector("button[type='submit']");

        message.textContent = "";
        message.style.color = "#f87171";

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (response.ok) {
                message.style.color = "#34d399";
                message.textContent = result.message;

                registerForm.reset();
            } else {
                message.textContent = result.error || "Registration failed.";
            }

        } catch (error) {
            console.error("Registration error:", error);
            message.textContent = "Unable to connect to the server.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create Account";
        }
    });
}


const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("loginMessage");
        const submitButton = loginForm.querySelector("button[type='submit']");

        message.textContent = "";
        message.style.color = "#f87171";

        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (response.ok) {
                message.style.color = "#34d399";
                message.textContent = result.message;

                // Redirect after successful login
                window.location.href = "/dashboard";

            } else {
                message.textContent = result.error || "Login failed.";
            }

        } catch (error) {
            console.error("Login error:", error);
            message.textContent = "Unable to connect to the server.";

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Log In";
        }
    });
}
