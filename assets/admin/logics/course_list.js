// $(document).ready(function() {
//     $.ajax({
//         url: '/admin/get-courses',
//         method: 'GET',
//         success: function(response) {
//             if (response.success) {
//                 const tableBody = $('#adminsTableBody');
//                 tableBody.empty();

//                 response.data.forEach(course => {
//                     const row = `
//                         <tr>
//                             <td>${course.title}</td>
//                             <td>${course.type}</td>
//                             <td>${course.type === 'free' ? 'Free' : '₹' + course.price}</td>
//                             <td>
//                                 <button class="btn btn-sm btn-primary edit-btn" data-id="${course._id}">Edit</button>
//                                 <button class="btn btn-sm btn-danger delete-btn" data-id="${course._id}">Delete</button>
//                             </td>
//                         </tr>
//                     `;
//                     tableBody.append(row);
//                 });
//             } else {
//                 console.error('Error:', response.message);
//             }
//         },
//         error: function(err) {
//             console.error('AJAX Error:', err);
//         }
//     });
// });

$(document).ready(function() {
  let currentPage = 1;

  // Load courses with pagination
  function loadCourses(page = 1) {
    $.ajax({
      url: `/admin/get-courses?page=${page}`,
      method: "GET",
      success: function(response) {
        if (response.success) {
          const tableBody = $("#adminsTableBody");
          tableBody.empty();

          response.data.forEach(course => {
            const row = `
              <tr class="text-white">
                <td>${course.title}</td>
                <td>${course.type}</td>
                <td>${course.type === 'free' ? 'Free' : '₹' + course.price}</td>
                <td>
                  <button class="btn btn-sm btn-primary edit-btn" data-id="${course._id}">Edit</button>
                  <button class="btn btn-sm btn-danger delete-btn" data-id="${course._id}">Delete</button>
                </td>
              </tr>
            `;
            tableBody.append(row);
          });

          renderPagination(response.pagination);
        }
      },
      error: function(err) {
        console.error("Error fetching courses:", err);
      }
    });
  }

  // Render pagination buttons
  function renderPagination(pagination) {
    const { page, pages } = pagination;
    const paginationContainer = $("#pagination");
    paginationContainer.empty();

    // Previous Button
    paginationContainer.append(`
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page - 1}">Previous</a>
      </li>
    `);

    // Page Numbers
    for (let i = 1; i <= pages; i++) {
      paginationContainer.append(`
        <li class="page-item ${i === page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `);
    }

    // Next Button
    paginationContainer.append(`
      <li class="page-item ${page === pages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page + 1}">Next</a>
      </li>
    `);
  }

  // Handle pagination click
  $(document).on("click", ".page-link", function(e) {
    e.preventDefault();
    const page = $(this).data("page");
    if (page && page > 0) {
      currentPage = page;
      loadCourses(page);
    }
  });

  // Edit button click
  $(document).on("click", ".edit-btn", function() {
    const id = $(this).data("id");
    window.location.href = `/edit-course/${id}`;
  });

  // Delete button click
  $(document).on("click", ".delete-btn", function() {
    const id = $(this).data("id");

    Swal.fire({
      title: "Are you sure?",
      text: "This course will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      background: "#1e1e2f",
      color: "#ffffff",
      iconColor: "#00d97e"
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/admin/delete-course/${id}`,
          method: "DELETE",
          success: function(response) {
            if (response.success) {
                Swal.fire({
                    title: "Deleted!",
                    text: "Course deleted successfully.",
                    icon: "success",
                    background: "#1e1e2f",
                    color: "#ffffff",
                    iconColor: "#00d97e",
                    confirmButtonColor: "#00d97e",
                }).then(() => {
                    loadCourses(currentPage);
                });
            } else {
              Swal.fire("Error!", response.message, "error");
            }
          },
          error: function() {
            Swal.fire("Error!", "Failed to delete course.", "error");
          }
        });
      }
    });
  });

  // Initial load
  loadCourses(currentPage);
});