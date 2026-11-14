
document.addEventListener("DOMContentLoaded", () => {
    const STUDENTS_API = "/api/students";
    const ANALYTICS_API = "/api/analytics";

    let students = [];
    let editingStudentId = null;

    // Match the IDs in your existing index.html
    const studentForm = document.getElementById("student-form");
    const studentTable = document.getElementById("student-table-body");
    const searchInput = document.getElementById("search-input");
    const formMessage = document.getElementById("form-message");
    const saveButton = document.getElementById("save-btn");
    const cancelButton = document.getElementById("cancel-edit");
    const refreshButton = document.getElementById("refresh-btn");

    const modal = document.getElementById("details-modal");
    const modalContent = document.getElementById("modal-content");
    const closeModalButton = document.getElementById("close-modal");

    // Safely display messages below the form
    function showMessage(message, isError = false) {
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.classList.toggle("error", isError);
    }

    // Display temporary notifications
    let toastTimer;

    function showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    }

    // Send requests to Flask and handle backend errors
    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error || data.message || `Request failed (${response.status})`
            );
        }

        return data;
    }

    // Escape values before placing them in HTML
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function formatNumber(value, decimals = 1) {
        const number = Number(value);
        return Number.isFinite(number) ? number.toFixed(decimals) : "—";
    }

    // Match the classification returned by app.py
    function getStatusClass(status) {
        if (status === "HIGH PRIORITY") return "high";
        if (status === "SUPPORT RECOMMENDED") return "support";
        return "clear";
    }

    // Load students from data/students.csv through Flask
    async function loadStudents() {
        try {
            const data = await apiRequest(STUDENTS_API);
            students = Array.isArray(data) ? data : [];
            renderStudents();
        } catch (error) {
            console.error("Unable to load students:", error);

            if (studentTable) {
                studentTable.innerHTML = `
                    <tr>
                        <td colspan="7" class="empty">
                            Unable to load student records.
                            ${escapeHTML(error.message)}
                        </td>
                    </tr>
                `;
            }

            showToast("Could not load student records.");
        }
    }

    // Load dashboard statistics from Flask
    async function loadAnalytics() {
        try {
            const data = await apiRequest(ANALYTICS_API);

            setText("total-students", data.total_students ?? 0);
            setText("average-score", formatNumber(data.average_score));
            setText(
                "average-attendance",
                formatNumber(data.average_attendance)
            );

            setText("high-priority", data.high_priority_count ?? 0);
            setText("high-priority-detail", data.high_priority_count ?? 0);
            setText("support-count", data.support_count ?? 0);
            setText("no-flag-count", data.no_flag_count ?? 0);
        } catch (error) {
            console.error("Unable to load analytics:", error);
        }
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    // Display records in the table
    function renderStudents() {
        if (!studentTable) return;

        const query = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const filtered = students.filter(student =>
            String(student.student_id).toLowerCase().includes(query) ||
            String(student.group).toLowerCase().includes(query)
        );

        setText(
            "record-count",
            `${filtered.length} record${filtered.length === 1 ? "" : "s"}`
        );

        if (filtered.length === 0) {
            studentTable.innerHTML = `
                <tr>
                    <td colspan="7" class="empty">
                        No matching student records found.
                    </td>
                </tr>
            `;
            return;
        }

        studentTable.innerHTML = filtered.map(student => {
            const id = escapeHTML(student.student_id);
            const group = escapeHTML(student.group);
            const attendance = formatNumber(student.attendance_pct);
            const score = formatNumber(student.average_score);
            const hours = formatNumber(student.study_hours);

            const status = escapeHTML(student.status);
            const statusClass = getStatusClass(student.status);

            return `
                <tr>
                    <td><strong>${id}</strong></td>
                    <td>${group}</td>
                    <td>${attendance}%</td>
                    <td>${score}</td>
                    <td>${hours}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${status}
                        </span>
                    </td>
                    <td>
                        <div class="action-group">
                            <button class="action-btn"
                                data-action="explain" data-id="${id}">
                                Explain
                            </button>
                            <button class="action-btn"
                                data-action="edit" data-id="${id}">
                                Edit
                            </button>
                            <button class="action-btn delete"
                                data-action="delete" data-id="${id}">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Read values using the actual input IDs in index.html
    function getFormData() {
        return {
            student_id: document.getElementById("student_id").value.trim(),
            group: document.getElementById("group").value.trim(),
            attendance_pct: document.getElementById("attendance_pct").value,
            average_score: document.getElementById("average_score").value,
            study_hours: document.getElementById("study_hours").value
        };
    }

    function validateStudent(student) {
        if (!student.student_id) return "Student ID is required.";
        if (!student.group) return "Student group is required.";

        const attendance = Number(student.attendance_pct);
        const score = Number(student.average_score);
        const hours = Number(student.study_hours);

        if (student.attendance_pct === "" ||
            !Number.isFinite(attendance) ||
            attendance < 0 || attendance > 100) {
            return "Attendance must be between 0 and 100.";
        }

        if (student.average_score === "" ||
            !Number.isFinite(score) || score < 0 || score > 100) {
            return "Average score must be between 0 and 100.";
        }

        if (student.study_hours === "" ||
            !Number.isFinite(hours) || hours < 0 || hours > 24) {
            return "Study hours must be between 0 and 24.";
        }

        student.attendance_pct = attendance;
        student.average_score = score;
        student.study_hours = hours;

        return null;
    }

    function resetForm() {
        if (studentForm) studentForm.reset();

        editingStudentId = null;

        if (saveButton) {
            saveButton.textContent = "＋ Add student";
        }

        if (cancelButton) {
            cancelButton.classList.add("hidden");
        }

        if (document.getElementById("form-title")) {
            document.getElementById("form-title").textContent = "Add a student";
        }

        showMessage("");
    }

    // Add or update a student
    if (studentForm) {
        studentForm.addEventListener("submit", async event => {
            event.preventDefault();

            const student = getFormData();
            const validationError = validateStudent(student);

            if (validationError) {
                showMessage(validationError, true);
                return;
            }

            try {
                if (saveButton) saveButton.disabled = true;

                if (editingStudentId !== null) {
                    await apiRequest(
                        `${STUDENTS_API}/${encodeURIComponent(editingStudentId)}`,
                        {
                            method: "PUT",
                            body: JSON.stringify(student)
                        }
                    );

                    showToast("Student updated successfully.");
                } else {
                    await apiRequest(STUDENTS_API, {
                        method: "POST",
                        body: JSON.stringify(student)
                    });

                    showToast("Student added successfully.");
                }

                resetForm();

                await Promise.all([
                    loadStudents(),
                    loadAnalytics()
                ]);
            } catch (error) {
                showMessage(error.message, true);
            } finally {
                if (saveButton) saveButton.disabled = false;
            }
        });
    }

    // Cancel editing
    if (cancelButton) {
        cancelButton.addEventListener("click", resetForm);
    }

    // Search by student ID or group
    if (searchInput) {
        searchInput.addEventListener("input", renderStudents);
    }

    // Refresh dashboard
    if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
            await Promise.all([loadStudents(), loadAnalytics()]);
            showToast("Dashboard data refreshed.");
        });
    }

    // Edit, delete and explain buttons
    if (studentTable) {
        studentTable.addEventListener("click", async event => {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            const studentId = button.dataset.id;

            const student = students.find(
                item => String(item.student_id) === studentId
            );

            if (!student) return;

            if (action === "edit") {
                editingStudentId = student.student_id;

                document.getElementById("student_id").value = student.student_id;
                document.getElementById("group").value = student.group;
                document.getElementById("attendance_pct").value =
                    student.attendance_pct;
                document.getElementById("average_score").value =
                    student.average_score;
                document.getElementById("study_hours").value =
                    student.study_hours;

                document.getElementById("form-title").textContent =
                    "Edit student";

                saveButton.textContent = "Save changes";
                cancelButton.classList.remove("hidden");

                showMessage(`Editing ${studentId}`);

                studentForm.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

            if (action === "delete") {
                if (!window.confirm(`Delete student ${studentId}?`)) return;

                try {
                    await apiRequest(
                        `${STUDENTS_API}/${encodeURIComponent(studentId)}`,
                        { method: "DELETE" }
                    );

                    await Promise.all([loadStudents(), loadAnalytics()]);
                    showToast("Student deleted successfully.");
                } catch (error) {
                    window.alert(error.message);
                }
            }

            if (action === "explain") {
                showExplanation(student);
            }
        });
    }

    // Explain the rules applied by the backend
    function showExplanation(student) {
        if (!modal || !modalContent) return;

        const reasons = Array.isArray(student.reasons)
            ? student.reasons
            : [];

        const reasonHTML = reasons.length
            ? `<ul>${reasons.map(reason =>
                `<li>${escapeHTML(reason)}</li>`
            ).join("")}</ul>`
            : "<p>No configured support rules were triggered.</p>";

        modalContent.innerHTML = `
            <p><strong>Student ID:</strong>
                ${escapeHTML(student.student_id)}</p>
            <p><strong>Group:</strong>
                ${escapeHTML(student.group)}</p>
            <p><strong>Attendance:</strong>
                ${formatNumber(student.attendance_pct)}%</p>
            <p><strong>Average score:</strong>
                ${formatNumber(student.average_score)}</p>
            <p><strong>Study hours:</strong>
                ${formatNumber(student.study_hours)}</p>
            <p><strong>Classification:</strong>
                ${escapeHTML(student.status)}</p>
            <h3>Reasons</h3>
            ${reasonHTML}
        `;

        modal.classList.remove("hidden");
    }

    // Close the explanation modal
    function closeModal() {
        if (modal) modal.classList.add("hidden");
    }

    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeModal);
    }

    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal();
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeModal();
    });

    // Initial dashboard load
    loadStudents();
    loadAnalytics();
});
