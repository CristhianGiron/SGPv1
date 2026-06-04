create table didactic_plans (
    deleted bit not null,
    end_week date,
    periods integer,
    start_week date,
    weeks integer,
    author_id bigint not null,
    course_id bigint not null,
    created_at datetime(6),
    deleted_at datetime(6),
    educational_institution_id bigint,
    enrollment_id bigint not null,
    id bigint not null auto_increment,
    recommended_at datetime(6),
    recommended_by bigint,
    source_plan_id bigint,
    student_id bigint not null,
    submitted_at datetime(6),
    updated_at datetime(6),
    uploaded_pdf_size bigint,
    area_subject varchar(255),
    author_type varchar(255) not null,
    grade_course varchar(255),
    parallel varchar(50),
    planning_unit_title varchar(500),
    status varchar(255),
    teacher_name varchar(255),
    title varchar(255),
    uploaded_pdf_content_type varchar(255),
    uploaded_pdf_filename varchar(255),
    curricular_insertions longtext,
    dua_principles longtext,
    evaluation_criteria longtext,
    learning_objectives longtext,
    recommendations longtext,
    uploaded_pdf longblob,
    primary key (id)
) engine=InnoDB;

create table didactic_plan_weeks (
    end_date date,
    start_date date,
    week_number integer,
    id bigint not null auto_increment,
    plan_id bigint not null,
    contents longtext,
    evaluation_activities longtext,
    evaluation_indicators longtext,
    methodology_activities longtext,
    resources longtext,
    skill longtext,
    primary key (id)
) engine=InnoDB;

alter table didactic_plans add constraint fk_didactic_plans_author foreign key (author_id) references accounts (id);
alter table didactic_plans add constraint fk_didactic_plans_course foreign key (course_id) references courses (id);
alter table didactic_plans add constraint fk_didactic_plans_enrollment foreign key (enrollment_id) references enrollments (id);
alter table didactic_plans add constraint fk_didactic_plans_institution foreign key (educational_institution_id) references institutions (id);
alter table didactic_plans add constraint fk_didactic_plans_recommended_by foreign key (recommended_by) references accounts (id);
alter table didactic_plans add constraint fk_didactic_plans_source foreign key (source_plan_id) references didactic_plans (id);
alter table didactic_plans add constraint fk_didactic_plans_student foreign key (student_id) references accounts (id);
alter table didactic_plan_weeks add constraint fk_didactic_plan_weeks_plan foreign key (plan_id) references didactic_plans (id);
