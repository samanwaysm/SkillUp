

exports.adminLogin = (req, res) => {
    res.render("admin/adminLogin",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.dashboard = (req, res) => {
    res.render("admin/dashboard",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.courseList = (req, res) => {
    res.render("admin/courseList",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.addCourse = (req, res) => {
    res.render("admin/addCourse",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.editCourse = (req, res) => {
    res.render("admin/editCourse",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.usersList = (req, res) => {
    res.render("admin/usersList",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.editUser = (req, res) => {
    res.render("admin/editUser",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}