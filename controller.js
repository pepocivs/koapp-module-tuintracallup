(function() {
  'use strict';

  angular
    .module('tuintracallup', [])
    .controller('tuintracallupController', loadFunction);

  loadFunction.$inject = ['$rootScope', '$scope', '$location', '$http', '$window', '$filter',
                          'structureService', 'storageService'];

  function loadFunction($rootScope, $scope, $location, $http, $window, $filter,
                        structureService, storageService) {

    structureService.registerModule($location, $scope, 'tuintracallup');

    $scope.backButton    = backButton;
    $scope.setTeamFilter = setTeamFilter;
    $scope.selectPlayer  = selectPlayer;
    $scope.sendCallup    = sendCallup;
    $rootScope.isBusy    = true;

    var teamId          = ($location.search().teamId) ? $location.search().teamId : false;
    var gameId          = ($location.search().gameId) ? $location.search().gameId : false;
    var userData        = {};
    var token           = 'noToken';
    var apiServer       = 'http://api.tuintra.com/';

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
          .finally(applyScope)
          .catch(showError);
      }
    }

    function getTeamFilter(){
      return $http.get(apiServer+userData.domain+'/teams')
      .success(function(teams){
        $scope.teams = teams;

      });
    }

    function getCallUp(){
      return $http.get(apiServer+userData.domain+'/callup/'+gameId+'/'+teamId)
      .success(function(callUpData){
        $scope.callup    = getCallupPlayers(callUpData);
        $scope.extraInfo = callUpData.info;
        console.log($scope.extraInfo);
      });
    }

    function getPlayers(){
      return $http({
        method: 'GET',
        url: apiServer+'people?teamId='+$scope.teamId,
        headers: {'x-access-token': token},
      })
      .success(function(players){
        $scope.players = players;
      });
    }

    function sendCallup(){
      var callupPrepared = {
        "gameId": gameId,
        "teamId": teamId,
        "info": {
          "clothes": ($scope.extraInfo) ? $scope.extraInfo.clothes : null,
          "meetTime": ($scope.extraInfo) ? $scope.extraInfo.meetTime : null,
          "meetPlace": ($scope.extraInfo) ? $scope.extraInfo.meetPlace : null,
          "comments": ($scope.extraInfo) ? $scope.extraInfo.comments : null
        },
        "players": prepareCallup($scope.callup.players)
      };
      return $http.post(apiServer+'callup', callupPrepared, {
        headers: {'x-access-token': token}
      })
      .success(function(players){
        showError('OK -> '+players);
      })
      .catch(showError);
    }

    function getCallupPlayers(playerData) {
      var preparedPlayers = [];
      playerData.players.forEach(function(player) {
        player.playerData.playerData = {
          'picture': player.playerData.picture,
          'number' : player.playerData.number,
        };
        delete player.playerData.picture;
        delete player.playerData.number;
        preparedPlayers.push(player.playerData);
      });
      playerData.players = preparedPlayers;

      return playerData;
    }

    function prepareCallup(players) {
      var cleanedPlayers = [];
      players.forEach(function(playerData){
        cleanedPlayers.push({
          "stats": null,
          "createdAt": new Date(),
          "responseAt": null,
          "sentAt": null,
          "status": {
            "_id": 0,
            "text": "Sín respuesta"
          },
          "playerData": playerData
        });
      })
      return cleanedPlayers;
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
          console.log(player);
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
      $scope.tuintracallup.message = $filter('translate')('tuintra-callup.error-loading')+' - '+e;
      applyScope();
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
