# 🏗️ Bootcamp Management System (BMS) - System Architecture & Flow

This document explains the end-to-end flow of the BMS, focusing on its dynamic recruitment engine and the lifecycle of a student.

---

## 1. The Core Architecture (Division-Based)
The system is built on a **Division-Based Multi-Tenant** model.
- **Super Admins:** Oversee the entire academy.
- **Divisions:** Specialized branches (e.g., Software Engineering, Data Science).
- **Admins:** Manage one or more divisions. They have full control over their territory but cannot touch other divisions.

---

## 2. 🧩 The Bootcamp Application Template (Dynamic Forms)
One of the most powerful features of BMS is the **Dynamic Template Engine**.

### How it Works:
Instead of hardcoding application forms, the Admin creates a **Recipe (Template)** for each bootcamp.
- **Phase 1 Fields:** Questions for the initial screening (e.g., "Experience", "Goals").
- **Phase 2 Fields:** Questions for the technical stage (e.g., "GitHub Link").
- **Waitlist Fields:** Standby information.

### The "Auto-Build" Logic:
The frontend fetches the template JSON and **automatically renders** the form fields. This allows Admins to change the questions for a bootcamp in seconds without writing any new code.

---

## 🚀 3. The Recruitment Funnel (Student Journey)

### Phase 1: The Initial Application
1. **Browse:** Student visits the landing page and sees published bootcamps.
2. **Apply:** Student fills out the dynamic form (Phase 1) based on the Admin's template.
3. **Status:** Application starts as `PENDING`.

### Phase 2: Technical Screening
1. **PASS Decision:** Admin reviews Phase 1 and moves the student to Phase 2.
2. **Task Assignment:** The system notifies the student to submit their technical task.
3. **Technical Submission:** Student provides the data (e.g., a code repo) requested in the Template's `phase2Fields`.

### Phase 3: Final Selection
1. **Review:** Admin evaluates the technical work.
2. **The Decisions:**
   - **REJECT:** Student receives a professional rejection email.
   - **WAIT:** Student is moved to the **Waitlist** status.
   - **ACCEPT:** The student is officially admitted!

---

## 🔑 4. Secure Onboarding & Activation
BMS uses a **Double-Verification** system to ensure high-quality cohorts.
1. **The OTP:** When an Admin clicks **ACCEPT**, the system generates a 6-digit **Enrollment OTP** and sends it via email.
2. **Enrollment Lock:** A record is created in the database, but it is `is_active: false`.
3. **Activation:** The student must log in and enter the OTP to "Unlock" their classroom. This ensures they are committed and have a verified email.

---

## 📅 5. The Classroom Experience
Once active, the student enters the engagement phase:
- **Sessions:** Students receive automated email invitations with **Calendar (.ics) files**.
- **Attendance:** Uses a **High-Trust Rotating QR System**. Students scan a token that regenerates every 20 seconds to prevent cheating.
- **Tasks & Feedback:** Students submit work for sessions and provide feedback, which Admins use to monitor instructor performance.

---

## 🎓 6. Graduation & Membership
At the end of the bootcamp:
1. **Promotion:** Admin promotes successful students to **"Members."**
2. **Alumni Pool:** Members are added to a global pool. They can be selected later to become **Instructors** or **Admins** for new divisions.
3. **Success Stories:** The best achievements are featured on the public landing page to attract new students.
