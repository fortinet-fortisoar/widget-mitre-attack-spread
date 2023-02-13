'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editMitreAttackSpread100Ctrl', editMitreAttackSpread100Ctrl);

    editMitreAttackSpread100Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'ALL_RECORDS_SIZE', '$state', '$resource', 'API'];

    function editMitreAttackSpread100Ctrl($scope, $uibModalInstance, config, ALL_RECORDS_SIZE, $state, $resource, API) {
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.config = config;

        $scope.toggleDisabled = false;

        $scope.toggleTechniques = toggleTechniques;
        $scope.toggleSubtechniques = toggleSubtechniques;

        $scope.hideTactics = hideTactics;
        $scope.hideTechniques = hideTechniques;
        $scope.hideParentTactics = hideParentTactics;

        $scope.filterGroups = filterGroups;
        $scope.loadGroups = loadGroups;

        $scope.enableHeatmap = enableHeatmap;

        $scope.enableCoverage = enableCoverage;

        $scope.groups = {"module": "mitre_groups", "query": {"__selectFields": ["name", "mitreId", "techniques"], 
                                                            "sort": [
                                                              {
                                                                "field": "name",
                                                                "direction": "asc"
                                                              }]}};

        init();

        function init() {
          if ($scope.config.displayTechniques == undefined) {
            $scope.config.displayTechniques = false;
          }
          if ($scope.config.displaySubtechniques == undefined) {
            $scope.config.displaySubtechniques = false;
          }
          if ($scope.config.hideTactics == undefined) {
            $scope.config.hideTactics = false;
          }
          if ($scope.config.hideTechniques == undefined) {
            $scope.config.hideTechniques = false;
          }
          if ($scope.config.hideParentTactics == undefined) {
            $scope.config.hideParentTactics = false;
          }
          if ($scope.config.filterGroups == undefined) {
            $scope.config.filterGroups = false;
          }
          if ($scope.config.enableHeatmap == undefined) {
            $scope.config.enableHeatmap = false;
          }
          if ($scope.config.enableCoverage == undefined) {
            $scope.config.enableCoverage = false;
          }
          if ($scope.config.toggleDisabledExpand == undefined) {
            $scope.config.toggleDisabledExpand = false;
          }
          if ($scope.config.previousGroups.length != 0 && $scope.config.filterGroups) {
            $scope.config.selectedGroups = $scope.config.previousGroups;
          }
          else {
            $scope.config.selectedGroups = [];
          }
          
          if ($state.params.page.includes('detail')) {
            $scope.toggleDisabled = true;
          }
        }

        function toggleTechniques() {
          $scope.config.displayTechniques = !$scope.config.displayTechniques;
          if (!$scope.config.displayTechniques && $scope.config.displaySubtechniques) {
            $scope.config.displaySubtechniques = false;
          }
        }

        function toggleSubtechniques() {
          $scope.config.displaySubtechniques = !$scope.config.displaySubtechniques;
        }

        function hideTactics() {
          $scope.config.hideTactics = !$scope.config.hideTactics;
          $scope.hideParentTactics();
        }
        function hideTechniques() {
          $scope.config.hideTechniques = !$scope.config.hideTechniques;
          if (!$scope.config.hideTechniques && $scope.config.hideParentTactics) {
            $scope.config.hideParentTactics = false;
          }
        }
        function hideParentTactics() {
          $scope.config.hideParentTactics = !$scope.config.hideParentTactics;
        }

        function filterGroups() {
          $scope.config.filterGroups = !$scope.config.filterGroups;
          if ($scope.config.filterGroups) {
            loadGroups();
          }
          else {
            $scope.config.selectedGroups = [];
            $scope.config.previousGroups = [];
          }
        }

        function loadGroups() {
          $scope.processing = true;
          $resource(API.QUERY + $scope.groups.module + '?$limit=' + ALL_RECORDS_SIZE + '&$export=true').save($scope.groups.query).$promise.then(function (response) {
            $scope.config.groupsRecords = response['hydra:member'];
            $scope.processing = false;
          }, angular.noop).finally(function () {
            $scope.processing = false;
          });
        }

        function enableHeatmap() {
          $scope.config.enableHeatmap = !$scope.config.enableHeatmap;
        }

        function enableCoverage() {
          $scope.config.enableCoverage = !$scope.config.enableCoverage;
          $scope.config.toggleDisabledExpand = !$scope.config.toggleDisabledExpand;
          if ($scope.config.enableCoverage) {
            $scope.config.displayTechniques = false;
            $scope.config.displaySubtechniques = false;
          }
        }

        function cancel() {
          $uibModalInstance.dismiss('cancel');
        }

        function save() {
          $uibModalInstance.close($scope.config);
        }
    }
})();
