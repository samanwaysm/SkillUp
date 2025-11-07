

exports.home = (req, res) => {
    const { user } = req.session
    delete req.session.errors
    res.render("user/home",{user},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.login = (req, res) => {
    res.render("user/login",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.register = (req, res) => {
    res.render("user/register",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.otpverify = (req, res) => {
    res.render("user/otpverify",(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.courses = (req, res) => {
    const { user } = req.session
    delete req.session.errors
    res.render("user/courses",{user},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.courseDetail = (req, res) => {
    const { user } = req.session
    delete req.session.errors
    res.render("user/courseDetail",{user},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}
