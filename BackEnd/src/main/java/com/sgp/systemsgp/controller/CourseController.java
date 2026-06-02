package com.sgp.systemsgp.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sgp.systemsgp.dto.course.CourseResponse;
import com.sgp.systemsgp.dto.course.CreateCourseRequest;
import com.sgp.systemsgp.dto.course.UpdateCoursePracticeProfileRequest;
import com.sgp.systemsgp.dto.coursegroup.CourseGroupResponse;
import com.sgp.systemsgp.dto.coursegroup.CreateCourseGroupRequest;
import com.sgp.systemsgp.dto.coursegroup.UpdateCourseGroupRequest;
import com.sgp.systemsgp.service.CourseService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
    public CourseResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateCourseRequest request) {

        return courseService.createCourse(
                authentication.getName(),
                request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
    public List<CourseResponse> getAll(
            Authentication authentication) {

        return courseService.getAll(
                authentication.getName(),
                canManageCourses(authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
    public CourseResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return courseService.getById(authentication.getName(), id);
    }

    @PatchMapping("/{id}/practice-profile")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public CourseResponse updatePracticeProfile(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCoursePracticeProfileRequest request) {

        return courseService.updatePracticeProfile(
                authentication.getName(),
                id,
                request);
    }

    @GetMapping("/{id}/groups")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS', 'TUTOR_PRACTICAS')")
    public List<CourseGroupResponse> getGroups(
            Authentication authentication,
            @PathVariable Long id) {

        return courseService.getGroups(
                authentication.getName(),
                id);
    }

    @PostMapping("/{id}/groups")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR_PRACTICAS')")
    public CourseGroupResponse createGroup(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CreateCourseGroupRequest request) {

        return courseService.createGroup(
                authentication.getName(),
                id,
                request);
    }

    @PatchMapping("/groups/{groupId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR_PRACTICAS')")
    public CourseGroupResponse updateGroup(
            Authentication authentication,
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateCourseGroupRequest request) {

        return courseService.updateGroup(
                authentication.getName(),
                groupId,
                request);
    }

    @PatchMapping("/groups/{groupId}/institutional-tutor/{accountId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR_PRACTICAS')")
    public CourseGroupResponse assignGroupInstitutionalTutor(
            Authentication authentication,
            @PathVariable Long groupId,
            @PathVariable Long accountId) {

        return courseService.assignGroupInstitutionalTutor(
                authentication.getName(),
                groupId,
                accountId);
    }

    @PatchMapping("/groups/{groupId}/disable")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR_PRACTICAS')")
    public CourseGroupResponse disableGroup(
            Authentication authentication,
            @PathVariable Long groupId) {

        return courseService.disableGroup(
                authentication.getName(),
                groupId);
    }

    @PatchMapping("/groups/{groupId}/enable")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR_PRACTICAS')")
    public CourseGroupResponse enableGroup(
            Authentication authentication,
            @PathVariable Long groupId) {

        return courseService.enableGroup(
                authentication.getName(),
                groupId);
    }

    @PatchMapping("/{id}/institutional-tutor/{accountId}")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public CourseResponse assignInstitutionalTutor(
            Authentication authentication,

            @PathVariable Long id,

            @PathVariable Long accountId) {

        return courseService
                .assignInstitutionalTutor(
                        authentication.getName(),
                        id,
                        accountId);
    }

    @PatchMapping("/{id}/practice-tutor/{accountId}")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public CourseResponse assignPracticeTutor(
            Authentication authentication,

            @PathVariable Long id,

            @PathVariable Long accountId) {

        return courseService
                .assignPracticeTutor(
                        authentication.getName(),
                        id,
                        accountId);
    }

    @PatchMapping("/{id}/disable")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void disable(
            Authentication authentication,
            @PathVariable Long id) {

        courseService.disable(authentication.getName(), id);
    }

    @PatchMapping("/{id}/enable")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void enable(
            Authentication authentication,
            @PathVariable Long id) {

        courseService.enable(authentication.getName(), id);
    }

    @PatchMapping("/{id}/lock")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void lock(
            Authentication authentication,
            @PathVariable Long id) {

        courseService.lock(authentication.getName(), id);
    }

    @PatchMapping("/{id}/unlock")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void unlock(
            Authentication authentication,
            @PathVariable Long id) {

        courseService.unlock(authentication.getName(), id);
    }

    @DeleteMapping("/{id}")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void delete(
            Authentication authentication,
            @PathVariable Long id) {

        courseService.softDelete(authentication.getName(), id);
    }

    @PatchMapping("/{id}/restore")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void restore(
            Authentication authentication,
            @PathVariable Long id) {

        courseService.restore(authentication.getName(), id);
    }

    @DeleteMapping("/{id}/force")

    @PreAuthorize("hasRole('ADMIN')")

    public void forceDelete(
            @PathVariable Long id) {

        courseService.forceDelete(id);
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")

    public Page<CourseResponse> search(

            Authentication authentication,

            @RequestParam(required = false) String name,

            @RequestParam(required = false) Boolean active,

            @RequestParam(required = false) Boolean locked,

            @RequestParam(required = false) String institutionalTutor,

            @RequestParam(required = false) String practiceTutor,

            Pageable pageable) {

        Boolean effectiveActive = canManageCourses(authentication)
                ? active
                : true;
        String effectivePracticeTutor = isPracticeTutorOnly(authentication)
                ? authentication.getName()
                : practiceTutor;

        return courseService.search(

                authentication.getName(),

                name,

                effectiveActive,

                locked,

                institutionalTutor,

                effectivePracticeTutor,

                pageable);
    }

    private boolean canManageCourses(Authentication authentication) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_DIRECTOR_PRACTICAS"));
    }

    private boolean isPracticeTutorOnly(Authentication authentication) {

        boolean practiceTutor = authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_TUTOR_PRACTICAS"));

        return practiceTutor && !canManageCourses(authentication);
    }
}
