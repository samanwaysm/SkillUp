$(document).ready(function () {
  let currentPage = 1;
  let searchQuery = "";

  // 🔹 Load users with pagination + search
  function loadUsers(page = 1, search = "") {
    $.ajax({
      url: `/admin/get-users?page=${page}&search=${search}`,
      method: "GET",
      success: function (response) {
        if (response.success) {
          const tableBody = $("#adminsTableBody");
          tableBody.empty();

          if (response.data.length === 0) {
            tableBody.append(`
              <tr><td colspan="5" class="text-center text-muted">No users found</td></tr>
            `);
            $("#pagination").empty();
            return;
          }

          response.data.forEach(user => {
            const row = `
              <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || "-"}</td>
                <td>
                  <button class="btn btn-sm btn-primary edit-btn" data-id="${user._id}">Edit</button>
                  <button class="btn btn-sm btn-danger delete-btn" data-id="${user._id}">Delete</button>
                </td>
              </tr>
            `;
            tableBody.append(row);
          });

          renderPagination(response.pagination);
        } else {
          console.error("Error:", response.message);
        }
      },
      error: function (err) {
        console.error("Error fetching users:", err);
      }
    });
  }

  // 🔹 Render pagination buttons
  function renderPagination(pagination) {
    const { page, pages } = pagination;
    const paginationContainer = $("#pagination");
    paginationContainer.empty();

    if (pages <= 1) return; // No pagination if only 1 page

    paginationContainer.append(`
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page - 1}">Previous</a>
      </li>
    `);

    for (let i = 1; i <= pages; i++) {
      paginationContainer.append(`
        <li class="page-item ${i === page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `);
    }

    paginationContainer.append(`
      <li class="page-item ${page === pages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page + 1}">Next</a>
      </li>
    `);
  }

  // 🔹 Pagination click
  $(document).on("click", ".page-link", function (e) {
    e.preventDefault();
    const page = $(this).data("page");
    if (page && page > 0) {
      currentPage = page;
      loadUsers(page, searchQuery);
    }
  });

  // 🔹 Search box input
  $("#searchBox").on("keyup", function () {
    searchQuery = $(this).val().trim();
    loadUsers(1, searchQuery); // Reset to first page when searching
  });

  // 🔹 Edit button click
  $(document).on("click", ".edit-btn", function () {
    const id = $(this).data("id");
    window.location.href = `/edit-user/${id}`;
  });

  // 🔹 Delete button click
  $(document).on("click", ".delete-btn", function () {
    const id = $(this).data("id");

    Swal.fire({
      title: "Are you sure?",
      text: "This user will be permanently deleted!",
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
          url: `/admin/delete-user/${id}`,
          method: "DELETE",
          success: function (response) {
            if (response.success) {
                Swal.fire({
                    title: "Deleted!",
                    text: "User deleted successfully.",
                    icon: "success",
                    background: "#1e1e2f",
                    color: "#ffffff",
                    iconColor: "#00d97e",
                    confirmButtonColor: "#00d97e",
                }).then(() => {
                    loadUsers(currentPage, searchQuery);
                });
            } else {
              Swal.fire("Error!", response.message, "error");
            }
          },
          error: function () {
            Swal.fire("Error!", "Failed to delete user.", "error");
          }
        });
      }
    });
  });

  // 🔹 Initial load
  loadUsers(currentPage);
});
