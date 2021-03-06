(function() {
  'use strict';

  angular
    .module('tuintracallup', [])
    .controller('tuintracallupController', loadFunction);

  loadFunction.$inject = ['$scope', 'structureService', '$location'];

  function loadFunction($scope, structureService, $location) {
    // Register upper level modules
    structureService.registerModule($location, $scope, 'tuintracallup');
    // --- Start tuintracallupController content ---
    console.info('Hi! from tuintracallupController');
    // --- End tuintracallupController content ---
  }
}());
