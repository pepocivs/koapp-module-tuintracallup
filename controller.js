(function() {
  'use strict';

  angular
    .module('tuintracallup', [])
    .controller('tuintracallupController', loadFunction);

  loadFunction.$inject = ['$rootScope', '$scope', '$location', '$http', '$window',
                          'structureService', 'storageService'];

  function loadFunction($rootScope, $scope, $location, $http, $window,
                        structureService, storageService) {

    structureService.registerModule($location, $scope, 'tuintracallup');

    $scope.backButton    = backButton;
    $scope.setTeamFilter = setTeamFilter;
    $scope.selectPlayer  = selectPlayer;
    $rootScope.isBusy    = true;

    var teamId          = ($location.search().teamId) ? $location.search().teamId : false;
    var gameId          = ($location.search().gameId) ? $location.search().gameId : false;
    var userData        = {};
    var token           = 'noToken';

    $scope.teamId = angular.copy(teamId);

    if (teamId && gameId) init();
    else                  showError('team and game Id not found');

    function init(){
      storageService.get('tuintraLogin')
        .then(getInfo)
        .catch(showError);
    }

    function getInfo(data) {
      if (!data) showError($filter('translate')('tuintra-callup.notloged'));
      else {
        userData = data.value.userInfo;
        token    = data.value.token;
        getTeamFilter()
          .then(getCallUp)
          .then(getPlayers)
          .then(applyScope)
          .catch(showError);
      }
    }

    function getTeamFilter(){
      return $http.get('http://api.tuintra.com/'+userData.domain+'/teams')
      .success(function(teams){
        $scope.teams = teams;
      });
    }

    function getCallUp(){
      return $http.get('http://api.tuintra.com/'+userData.domain+'/callup/'+gameId+'/'+teamId)
      .success(function(callUpData){
        $scope.callup = callUpData;
      });
    }

    function getPlayers(){
      return $http({
        method: 'GET',
        url: 'http://api.tuintra.com/people?teamId='+$scope.teamId,
        headers: {'x-access-token': token},
      })
      .success(function(players){
        $scope.players = players;
      });
    }

    function setTeamFilter() {
      console.log('[S] Selected filter team: '+$scope.teamId);
      getPlayers()
        .then(applyScope)
        .catch(showError);
    }

    function selectPlayer(playerId) {
      if (!deletePlayer()) addPlayer();
      applyScope();

      function deletePlayer() {
        var exist = false;
        var position = false;
        $scope.callup.players.forEach(function(player, index) {
          if (player._id === playerId) {
            position = angular.copy(index);
            exist    = true;
          }
        });
        if (exist) $scope.callup.players.splice(position, 1);
        return exist;
      }

      function addPlayer(){
        $scope.players.forEach(function(player) {
          if (player._id === playerId) $scope.callup.players.push(player);
        });
      }
    }


    function backButton() {
      $window.history.back();
    }

    function showError(e){
      $scope.tuintracallupgames.message = $filter('translate')('tuintra-callup.error-loading')+' - '+e;
      $rootScope.isBusy = false;
    }

    function applyScope() {
      if(!$scope.$$phase) {
        $scope.$apply();
        $rootScope.$broadcast("renderKoaElements", {});
      }
      $rootScope.isBusy = false;
    }
  }
}());
