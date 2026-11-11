create table interface_images (
    active bit not null,
    display_order integer not null,
    file_size bigint not null,
    id bigint not null auto_increment,
    created_at datetime(6),
    updated_at datetime(6),
    uploaded_by_id bigint,
    content_type varchar(120) not null,
    original_filename varchar(255) not null,
    placement varchar(60) not null,
    title varchar(160) not null,
    description varchar(500),
    data LONGBLOB not null,
    primary key (id)
) engine=InnoDB;

alter table interface_images
    add constraint FK_interface_images_uploaded_by
    foreign key (uploaded_by_id)
    references accounts (id);
