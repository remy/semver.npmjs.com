var angular = require('angular');
var semver = require('semver');
var npa = require('npm-package-arg');
var app = angular.module('SemverApp', [])
    .config(['$locationProvider', function($locationProvider) {
      $locationProvider.html5Mode(true).hashPrefix('!');
    }]);

app.controller('VersionCtrl', function($scope, $http, $location) {
  var versions;
  var defaults = {
    name: 'lodash',
    rawSpec: '1.x',
  };

  var pkg = $location.hash();
  if (pkg) {
    defaults = npa(pkg);
  }

  $scope.package = defaults.name;
  $scope.loading = true;

  $scope.$on('$locationChangeSuccess', function () {
    var hash = $location.hash();
    if (!hash) {
      return;
    }

    var prevName = $scope.package;

    var pkg = npa(hash);
    $scope.range = pkg.rawSpec;
    $scope.package = pkg.name;
    if (!$scope.loading) {
      if (prevName !== pkg.name) {
        $scope.getVersions();
      } else {
        $scope.renderVersions();
      }
    }
  });

  $scope.checkVersions = function() {
    $location.hash($scope.package + '@' + $scope.range).replace();
  };

  $scope.fail = function () {
    $scope.loading = false;
    console.log('Sorry, could not load data.');
  };

  $scope.getVersions = function() {
    $scope.loading = true; // always show that spinner
    $scope.versions = [];
    $http.get('http://npm-registry-cors-proxy.herokuapp.com/' + $scope.package)
      .success(function(data) {
        if (!data.versions) {
          return $scope.fail();
        }

        versions = Object.keys(data.versions);

        $scope.range = defaults.rawSpec;
        $scope.versions = versions.map(function(v) {
          return {
            version: v
          };
        });

        $scope.renderVersions = function () {
          for (var i=0, len=versions.length; i<len; i++) {
            $scope.versions[i].satisfies = semver.satisfies($scope.versions[i].version, $scope.range);
          }
        };

        if ($scope.loading) { // only happens on complete package reload
          $scope.checkVersions();
        }

        $scope.renderVersions();
        $scope.loading = false;
      })
      .error($scope.fail);
  };

  $scope.getVersions();
});
