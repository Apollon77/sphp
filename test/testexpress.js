/* jshint -W097 */// jshint strict:false
/*jslint node: true */
var expect = require('chai').expect;
var path = require('path');
var request = require('request');

var express = require('express');
var sphp = require('../sphp');

var serving = false;
describe('Test Express only', function() {
    before('Setup Server', function (_done) {
        this.timeout(600000); // because of first install from npm

        var app = express();
        var options = {};
        options.docRoot = __dirname + path.sep + 'doc_root';
        if (process.env.PHP_PATH && process.env.PHP_PATH !== "") {
            options.cgiEngine = process.env.PHP_PATH;
            console.log('SPHP Use cgiEngine ' + options.cgiEngine);
        }

        var server = app.listen(20000, function() {
            console.log('SPHP Server started on port 20000 with Doc-Root ' + options.docRoot);
            serving = true;
        });

        app.use(sphp.express(options));
        app.use(express.static(options.docRoot));

        _done();
    });

    it('Test phpinfo()', function (done) {
        request('http://127.0.0.1:20000/phpinfo.php', function (error, response, body) {
            console.log('BODY: ' + body);
            expect(serving).to.be.true;
            expect(error).to.be.not.ok;
            expect(body.indexOf('<title>phpinfo()</title>')).to.be.not.equal(-1);
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    it('Test required-phpinfo()', function (done) {
        request('http://127.0.0.1:20000/subdir/required-phpinfo.php', function (error, response, body) {
            console.log('BODY: ' + body);
            expect(serving).to.be.true;
            expect(error).to.be.not.ok;
            expect(body.indexOf('<title>phpinfo()</title>')).to.be.not.equal(-1);
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    it('Test exception from setOptions', function (done) {
        var errorHandled = false;
        var originalException = process.listeners('uncaughtException').pop();
        if (originalException) process.removeListener('uncaughtException', originalException);
        process.once("uncaughtException", function (err) {
            console.log('CATCHED');
            if (originalException) process.listeners('uncaughtException').push(originalException);
            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.be.equal("PHP engine 'Invalid_PHP_engine' failed to start.");
            expect(counter).to.be.equal(0);
            done();
        });

        sphp.setOptions({cgiEngine: 'Invalid_PHP_engine'});
    });

    after('Stop Server', function (done) {
        this.timeout(10000);
        try {
            if (serving) {
                app.close();
                console.log('SPHP Server stopped');
            }
        } catch (e) {
        }
        done();
    });
});
