exports.getOverview = (req, res) => {
  res.status(200).render("base");
};

exports.getLoginForm = (req, res) => {
  res.status(200).render("login");
};
