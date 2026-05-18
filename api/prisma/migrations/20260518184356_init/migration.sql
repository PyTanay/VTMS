-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECOMMENDING_EMPLOYEE', 'TRAINING_CENTER_SECTION_HEAD', 'TRAINING_IN_CHARGE', 'ED_GM_APPROVER', 'APPLICANT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RECEIVED_BY_TC', 'SCRUTINIZED', 'ASSIGNED_TO_INCHARGE', 'PERMISSION_LETTER_SENT', 'JOINING_PENDING', 'DOCUMENTS_VERIFIED', 'BIODATA_COMPLETED', 'GATE_PASS_CREATED', 'POSTED', 'TRAINING_ACTIVE', 'NO_DUES_PENDING', 'REPORT_SUBMITTED', 'CERTIFICATE_READY', 'CERTIFICATE_ISSUED', 'TRAINING_COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicantType" AS ENUM ('EMPLOYEE_WARD', 'OTHER_REFERENCE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'APPLICANT',
    "employeeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "employee_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" SERIAL NOT NULL,
    "college_name" TEXT NOT NULL,
    "place" TEXT NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "department_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talukas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "talukas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "talukaId" INTEGER,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "branch_name" TEXT NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_years" (
    "id" SERIAL NOT NULL,
    "year_string" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "financial_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "application_no" TEXT NOT NULL,
    "applicant_type" "ApplicantType" NOT NULL,
    "application_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "student_surname" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "student_father_name" TEXT NOT NULL,
    "son_daughter" BOOLEAN NOT NULL DEFAULT false,
    "relation" TEXT,
    "student_email" TEXT NOT NULL,
    "student_mobile" TEXT NOT NULL,
    "presently_pursuing" BOOLEAN NOT NULL DEFAULT true,
    "training_compulsory" BOOLEAN NOT NULL DEFAULT true,
    "part_of_curriculum" BOOLEAN NOT NULL DEFAULT true,
    "full_time_course" BOOLEAN NOT NULL DEFAULT true,
    "past_training" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "year_of_study" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "college_pincode" TEXT,
    "college_website" TEXT,
    "college_hod_name" TEXT,
    "college_hod_email" TEXT,
    "college_letter_ref" TEXT,
    "college_letter_date" TIMESTAMP(3),
    "requested_from" TIMESTAMP(3) NOT NULL,
    "requested_to" TIMESTAMP(3) NOT NULL,
    "approved_from" TIMESTAMP(3),
    "approved_to" TIMESTAMP(3),
    "recommending_employee_id" INTEGER,
    "reference_details" TEXT,
    "scrutiny_in_charge_id" INTEGER,
    "scrutiny_date" TIMESTAMP(3),
    "scrutiny_remarks" TEXT,
    "permission_letter_ref" TEXT,
    "permission_letter_date" TIMESTAMP(3),
    "posting_department_id" INTEGER,
    "joining_date" TIMESTAMP(3),
    "gate_pass_no" TEXT,
    "gate_pass_valid_up_to" TIMESTAMP(3),
    "behavioral_rating" TEXT,
    "progress_rating" TEXT,
    "actual_completion_date" TIMESTAMP(3),
    "report_submission_date" TIMESTAMP(3),
    "certificate_ref" TEXT,
    "certificate_issue_date" TIMESTAMP(3),
    "no_due_ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_verifications" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by_id" INTEGER,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "document_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_forms" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "local_address" TEXT NOT NULL,
    "permanent_address" TEXT NOT NULL,
    "caste" TEXT,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "blood_group" TEXT,
    "physically_challenged" BOOLEAN NOT NULL DEFAULT false,
    "challenge_details" TEXT,
    "photo_path" TEXT,
    "student_declaration" BOOLEAN NOT NULL DEFAULT true,
    "student_signature_path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biodata_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_academics" (
    "id" SERIAL NOT NULL,
    "biodataId" INTEGER NOT NULL,
    "course_name" TEXT NOT NULL,
    "board_university" TEXT NOT NULL,
    "passing_year" INTEGER NOT NULL,
    "percentage_cgpa" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "biodata_academics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_other_trainings" (
    "id" SERIAL NOT NULL,
    "biodataId" INTEGER NOT NULL,
    "institute_name" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "training_period" TEXT NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "biodata_other_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_sports" (
    "id" SERIAL NOT NULL,
    "biodataId" INTEGER NOT NULL,
    "game_name" TEXT NOT NULL,
    "level_of_participation" TEXT NOT NULL,
    "achievements" TEXT,

    CONSTRAINT "biodata_sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_extracurriculars" (
    "id" SERIAL NOT NULL,
    "biodataId" INTEGER NOT NULL,
    "activity_name" TEXT NOT NULL,
    "achievements" TEXT,

    CONSTRAINT "biodata_extracurriculars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_family_members" (
    "id" SERIAL NOT NULL,
    "biodataId" INTEGER NOT NULL,
    "member_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "occupation" TEXT,
    "contact_no" TEXT,

    CONSTRAINT "biodata_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_gnfc_relatives" (
    "id" SERIAL NOT NULL,
    "biodataId" INTEGER NOT NULL,
    "relative_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "employee_no" TEXT NOT NULL,

    CONSTRAINT "biodata_gnfc_relatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_postings" (
    "id" SERIAL NOT NULL,
    "biodataId" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "in_charge" TEXT NOT NULL,
    "posting_from" TIMESTAMP(3) NOT NULL,
    "posting_to" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "biodata_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_letters" (
    "id" SERIAL NOT NULL,
    "ref_no" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualification_branch" TEXT NOT NULL,
    "college_short_name" TEXT NOT NULL,
    "college_place" TEXT NOT NULL,
    "posting_department" TEXT NOT NULL,
    "to_report_to" TEXT NOT NULL,
    "reporting_officer_email" TEXT NOT NULL,
    "selected_weekdays" TEXT NOT NULL,
    "training_in_charge" TEXT NOT NULL,
    "department_head" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posting_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_letter_students" (
    "id" SERIAL NOT NULL,
    "postingLetterId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "approved_days" TEXT,

    CONSTRAINT "posting_letter_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "certificate_ref" TEXT NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "behavioral_rating" TEXT NOT NULL,
    "progress_rating" TEXT NOT NULL,
    "actual_completion_date" TIMESTAMP(3) NOT NULL,
    "report_submission_date" TIMESTAMP(3) NOT NULL,
    "special_issue_remarks" TEXT,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicate_approved_by" TEXT,
    "duplicate_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "no_due_forms" (
    "id" SERIAL NOT NULL,
    "no_due_ref" TEXT NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "no_due_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "no_due_clearance_lines" (
    "id" SERIAL NOT NULL,
    "noDueId" INTEGER NOT NULL,
    "item_name" TEXT NOT NULL,
    "cleared" BOOLEAN NOT NULL DEFAULT false,
    "cleared_by_id" INTEGER,
    "cleared_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "no_due_clearance_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sent_status" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_no_key" ON "employees"("employee_no");

-- CreateIndex
CREATE UNIQUE INDEX "departments_department_name_key" ON "departments"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_name_key" ON "states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "branches_branch_name_key" ON "branches"("branch_name");

-- CreateIndex
CREATE UNIQUE INDEX "financial_years_year_string_key" ON "financial_years"("year_string");

-- CreateIndex
CREATE UNIQUE INDEX "applications_application_no_key" ON "applications"("application_no");

-- CreateIndex
CREATE UNIQUE INDEX "biodata_forms_applicationId_key" ON "biodata_forms"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "posting_letters_ref_no_key" ON "posting_letters"("ref_no");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_ref_key" ON "certificates"("certificate_ref");

-- CreateIndex
CREATE UNIQUE INDEX "no_due_forms_no_due_ref_key" ON "no_due_forms"("no_due_ref");

-- CreateIndex
CREATE UNIQUE INDEX "no_due_forms_applicationId_key" ON "no_due_forms"("applicationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talukas" ADD CONSTRAINT "talukas_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_talukaId_fkey" FOREIGN KEY ("talukaId") REFERENCES "talukas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_recommending_employee_id_fkey" FOREIGN KEY ("recommending_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_posting_department_id_fkey" FOREIGN KEY ("posting_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_forms" ADD CONSTRAINT "biodata_forms_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_academics" ADD CONSTRAINT "biodata_academics_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "biodata_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_other_trainings" ADD CONSTRAINT "biodata_other_trainings_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "biodata_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_sports" ADD CONSTRAINT "biodata_sports_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "biodata_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_extracurriculars" ADD CONSTRAINT "biodata_extracurriculars_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "biodata_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_family_members" ADD CONSTRAINT "biodata_family_members_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "biodata_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_gnfc_relatives" ADD CONSTRAINT "biodata_gnfc_relatives_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "biodata_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_postings" ADD CONSTRAINT "biodata_postings_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "biodata_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_letter_students" ADD CONSTRAINT "posting_letter_students_postingLetterId_fkey" FOREIGN KEY ("postingLetterId") REFERENCES "posting_letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_letter_students" ADD CONSTRAINT "posting_letter_students_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_due_forms" ADD CONSTRAINT "no_due_forms_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_due_clearance_lines" ADD CONSTRAINT "no_due_clearance_lines_noDueId_fkey" FOREIGN KEY ("noDueId") REFERENCES "no_due_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_due_clearance_lines" ADD CONSTRAINT "no_due_clearance_lines_cleared_by_id_fkey" FOREIGN KEY ("cleared_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
