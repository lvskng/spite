const express = require("express");
const passport = require("passport");
const saml = require("passport-saml");
const fs = require("fs");


var g_profile;
app = express();

passport.serializeUser(function (user, done) {
    done(null, user);
  });

passport.deserializeUser(function (user, done) {
done(null, user);
});

const samlStrategy = new saml.Strategy(
    {
        callbackUrl: "/login-idp/callback",
        entryPoint: "https://login.microsoftonline.com/b9130c9c-d5b2-4c3b-bf73-b202bbb09e0c/saml2",
        cert: fs.readFileSync("./certs/idp_key.pem", "utf8"),
        issuer: "https://spite.cfapps.eu10.hana.ondemand.com/login-idp/callback",
        identifierFormat: null,
        authnContext: "http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/windows"
    },
        function(profile, done) {
            g_profile = profile;
            done(null, profile);
    },

);

passport.use("samlStrategy", [samlStrategy]);

app.route("/metadata").get(function(req, res) {
    res.type("application/xml");
    res.status(200);
    res.send(
    samlStrategy.generateServiceProviderMetadata(
        fs.readFileSync("./certs/certscert.pem", "utf8")
    )
    );
});

const samlCallback = function(passport) {
    return function(req, res, next) {
        passport.authenticate("samlStrategy", function(err, user, info) {
            res.send("" + err + user + info + g_profile + req.user);

        }(req, res, next));

    };
};

app.route("/login-idp").get((req, res, next) => {
    passport.authenticate("samlStrategy", function(err, user, info){}(req, res, next));
});
app.route("/login-idp/callback").post(samlCallback(passport));

const baseURL = "spite.cfapps.eu10.hana.ondemand.com";
const port = process.env.PORT || 3000;

app.use(passport.initialize());

app.listen(port, function () {
    console.log('spite app listening on port ' + port);
  });

