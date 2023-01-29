'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('mitreAttackSpread100Ctrl', mitreAttackSpread100Ctrl);

  mitreAttackSpread100Ctrl.$inject = ['$scope', 'config', 'appModulesService', 'currentPermissionsService', 'usersService',
    '$state', '$filter', 'PagedCollection', 'Query', 'Modules', 'ALL_RECORDS_SIZE', 'API', '$resource',
    '_'
  ];

  function mitreAttackSpread100Ctrl($scope, config, appModulesService, currentPermissionsService, usersService,
    $state, $filter, PagedCollection, Query, Modules, ALL_RECORDS_SIZE, API, $resource, _) {

    $scope.tactics = {"module": "mitre_tactics",
                      "query": {"__selectFields": ["name", "mitreId", "techniques"],
                                "relationships": true,
                                "limit": ALL_RECORDS_SIZE}};
    $scope.techniques = {"module": "mitre_techniques", "query": {"limit": ALL_RECORDS_SIZE}};
    $scope.subtechniques = {"module": "mitre_sub_techniques", "query": {"limit": ALL_RECORDS_SIZE}};
    $scope.alerts = {"module": "alerts", "query": {"limit": ALL_RECORDS_SIZE}};
    $scope.incidents = {"module": "incidents", "query": {"limit": ALL_RECORDS_SIZE}};
    $scope.getTactics = getTactics;
    $scope.getSeverityPicklist = getSeverityPicklist;
    $scope.getSeverity = getSeverity;
    $scope.modulePermissions = currentPermissionsService.getPermission($scope.tactics.module);
    $scope.techniquesPermissions = currentPermissionsService.getPermission($scope.techniques.module);
    $scope.openRecord = openRecord;
    $scope.getRelationshipsCount = getRelationshipsCount;
    $scope.getSubtechniqueRelationshipsCount = getSubtechniqueRelationshipsCount;
    $scope.toggleShowRelationships = toggleShowRelationships;
    $scope.toggleShowSubtechniqueRelationships = toggleShowSubtechniqueRelationships;
    $scope.toggleHiddenTechniques = toggleHiddenTechniques;
    $scope.toggleHiddenTactics = toggleHiddenTactics;
    $scope.detail_display = false;
    $scope.record_relationships = [];
    $scope.detail_not_found = false;
    $scope.related_tactics = [];
    $scope.showInDetailView = showInDetailView;
    $scope.findRelatedTactics = findRelatedTactics;
    $scope.loadGroupRelationships = loadGroupRelationships;
    $scope.currentUser = usersService.getCurrentUser();
    $scope.currentTheme = 'dark';
    $scope.globalRefresh = globalRefresh;
    // angular.forEach($scope.modules, function(module) {
    //   $scope.modulesPermissions.push(currentPermissionsService.getPermission(module));
    // });
    // console.log($scope.modulesPermissions.every(True));
    if (!$scope.modulePermissions.read || !$scope.techniquesPermissions.read) {
      $scope.unauthorized = true;
      return;
    }

    init();

    function init() {
      // change widget colors based on the active theme
      if ($scope.currentUser) {
        $scope.currentTheme = $scope.currentUser['@settings'].user.view.theme;
      }
      if ($state.params.page.includes('detail')) {
        $scope.detail_display = true;
        // enforce the technique and subtechnique toggles to expand as it's needed to see linked alerts/incidents
        $scope.config.displayTechniques = true;
        $scope.config.displaySubtechniques = true;

        $scope.record_module = $state.params.module;
        $scope.record_uuid = $state.params.id;

        $scope.showInDetailView();
      }
      $scope.getSeverityPicklist();
      $scope.getTactics();
    }

    function getTactics() {
      $scope.processing = true;
      var tacticsCollection = new PagedCollection($scope.tactics.module, null, {"$limit": $scope.tactics.query.limit});
      tacticsCollection.query = new Query($scope.tactics.query);
      tacticsCollection.loadGridRecord().then(function() {
        angular.forEach(tacticsCollection.fieldRows, function(tactic) {
          tactic._mitreId = tactic.mitreId.value;
        });
        $scope.tacticsRecords = _.sortBy(tacticsCollection.fieldRows, '_mitreId'); // sort tactics based on their mitre id
        $scope.tacticsRecords._total_hidden = 0;
        $scope.tacticsRecords._toggled = $scope.config.hideTactics || $scope.config.hideParentTactics; // hide tactics if the filter is toggled on

        $scope.processing = false;
        $scope.getRelationshipsCount();
      }, angular.noop).finally(function () {
        $scope.processing = false;
      });
    }

    function getRelationshipsCount() {
      var query_body = {
        module: $scope.tactics.module,
        limit: ALL_RECORDS_SIZE,
        logic: 'AND',
        filters: [],
        aggregates: [{
          alias: 'techniques',
          field: 'techniques.uuid',
          operator: 'countdistinct'
        },
        {
          alias: 'alerts',
          field: 'alerts.uuid',
          operator: 'countdistinct'
        },
        {
          alias: 'incidents',
          field: 'incidents.uuid',
          operator: 'countdistinct'
        },
        {
          alias: 'uuid',
          field: 'uuid',
          operator: 'groupby'
        }]
      };

      angular.forEach($scope.tacticsRecords, function(tactic_record) {
        tactic_record._toggled = false; // keeps track if the tactic itself should be hidden
        tactic_record._toggled_detail = false; // keeps track if the tactic itself should be hidden in detail view
        tactic_record._hide_techniques = false; // keeps track of the hide techniques toggle for every tactic
        tactic_record._hidden_techniques_count = 0; // how many techniques should be hidden per tactic

        // show/hide tactic based on alert or incident relationship in detail view
        if ($scope.detail_display && $scope.related_tactics.length != 0) {
          if (!$scope.related_tactics.includes(tactic_record['@id'].value)) {
            tactic_record._toggled_detail = true;
          }
        }
        
        $resource(API.QUERY + query_body.module + '/' + tactic_record.uuid.value + '/techniques').save(query_body).$promise.then(function (response) {
          angular.forEach(tactic_record.techniques.value, function(technique) {
            var countObject = _.find(response['hydra:member'], {uuid: technique.uuid});
            if (countObject) {
              technique._subtechniqueCount = countObject.techniques;
              technique._alertCount = countObject.alerts;
              technique._incidentCount = countObject.incidents;
              technique._has_subtechnique_counts = false;

              // hide techniques if hide empty techniques toggle is turned on
              if ($scope.config.hideTechniques) {
                if (countObject.techniques == 0 && countObject.alerts == 0 && countObject.incidents == 0) {
                  technique._hide = true;
                  tactic_record._hide_techniques = true;
                  tactic_record._hidden_techniques_count++;
                }
                else {
                  technique._hide = false;
                }
              }

              // filter techniques by groups if the groups filter is active
              if ($scope.config.selectedGroups != undefined && $scope.config.selectedGroups.length != 0) {
                $scope.config.previousGroups = $scope.config.selectedGroups;
                technique._hide_by_group = false;
                loadGroupRelationships(technique, tactic_record);
              }

              // load all relationships immediately if it's being enforced by edit filters
              if ($scope.config.displayTechniques || $scope.config.enableCoverage) {
                if (countObject.techniques > 0) {
                  toggleShowRelationships(technique, 'subtechniques', false);
                }
                if (countObject.alerts > 0) {
                  toggleShowRelationships(technique, 'alerts', false);
                }
                if (countObject.incidents > 0) {
                  toggleShowRelationships(technique, 'incidents', false);
                }
              }
            }
          });
        });
      });
    }

    function getSubtechniqueRelationshipsCount(technique) {
      technique._show_subtechniques_coverage = false; // flag required for the coverage filter
      
      var query_body = {
        module: $scope.techniques.module,
        limit: ALL_RECORDS_SIZE,
        logic: 'AND',
        filters: [],
        aggregates: [{
          alias: 'alerts',
          field: 'alerts.uuid',
          operator: 'countdistinct'
        },
        {
          alias: 'incidents',
          field: 'incidents.uuid',
          operator: 'countdistinct'
        },
        {
          alias: 'uuid',
          field: 'uuid',
          operator: 'groupby'
        }]
      };

      $resource(API.QUERY + query_body.module + '/' + technique.uuid + '/techniques').save(query_body).$promise.then(function (response) {
        angular.forEach(technique._subtechniques, function(subtechnique) {
          var countObject = _.find(response['hydra:member'], {uuid: subtechnique.uuid});
          if (countObject) {
            subtechnique._alertCount = countObject.alerts;
            subtechnique._incidentCount = countObject.incidents;
            
            // load all relationships immediately if it's being enforced by edit filters
            if ($scope.config.displaySubtechniques || $scope.config.enableCoverage) {
              if (countObject.alerts > 0) {
                toggleShowSubtechniqueRelationships(subtechnique, 'alerts');
                technique._show_subtechniques_coverage = true;
              }
              if (countObject.incidents > 0) {
                toggleShowSubtechniqueRelationships(subtechnique, 'incidents');
                technique._show_subtechniques_coverage = true;
              }
            }
          }
        });
        technique._has_subtechnique_counts = true;
      });
    }

    function toggleShowRelationships(technique, module_name, clicked) {
      if (technique['_show_' + module_name] === undefined || technique['_show_' + module_name] === false) {
        // show relationships
        technique['_show_' + module_name] = true;
        if ($scope.config.enableCoverage) {
          // we need to switch this flag off when coverage filter is on
          // since the _show_subtechniques_coverage flag will take care of it
          technique._show_subtechniques = false; 
        }
        if (clicked) {
          // however if the subtechniques link is clicked by the user to toggle relationships
          // we need to switch the back on for techniques that aren't marked by the coverage filter
          technique['_show_' + module_name] = true;
        }
      }
      else if (technique['_show_' + module_name] === true) {
        // hide relationships
        technique['_show_' + module_name] = false;
        technique['_' + module_name + '_processing'] = false;
      }
      if (technique['_' + module_name] === undefined) {
        // first click, load relationships
        technique['_' + module_name + '_processing'] = true;
        Modules.get({
          module: $scope.techniques.module,
          id: technique.uuid,
          $limit: $scope.techniques.query.limit,
          $relationships: true,
          __selectFields: 'name,mitreId,techniques'
        }).$promise.then(function (result){
          // attempt to load all relationships to stop a new API request 
          // from being made with each click on different related module
          technique._subtechniques = result.techniques;
          technique._alerts = result.alerts;
          technique._incidents = result.incidents;
          technique['_' + module_name + '_processing'] = false;

          // determine which techniques/subtechniques to view 
          // based on alert/incident relationships in detail view
          if ($scope.detail_display) {
            technique._hide_in_detail_view = true;
          }
          if ($scope.detail_display && $scope.record_relationships.length != 0) {
            angular.forEach($scope.record_relationships, function(relationship) {
              if (relationship == technique['@id']) {
                technique._hide_in_detail_view = false;
              }
            });
          }

          // get alerts and incidents counts for subtechniques
          // need _has_subtechnique_counts flag in case user expands alerts or incidents on the technique first, 
          // otherwise subtechnique alert/incident counts won't load
          if ((module_name == 'subtechniques' && technique._subtechniques !== undefined) || !technique._has_subtechnique_counts) {
            getSubtechniqueRelationshipsCount(technique);
          }
        });
      }
    }

    function toggleShowSubtechniqueRelationships(subtechnique, module_name) {
      if (subtechnique['_show_' + module_name] === undefined || subtechnique['_show_' + module_name] === false) {
        // show relationships
        subtechnique['_show_' + module_name] = true;
      }
      else if (subtechnique['_show_' + module_name] === true) {
        // hide relationships
        subtechnique['_show_' + module_name] = false;
        subtechnique['_' + module_name + '_processing'] = false;
      }
      if (subtechnique['_' + module_name] === undefined) {
        // first click, load relationships
        subtechnique['_' + module_name + '_processing'] = true;
        Modules.get({
          module: $scope.subtechniques.module,
          id: subtechnique.uuid,
          $limit: $scope.subtechniques.query.limit,
          $relationships: true,
          __selectFields: 'name,mitreId,alerts,incidents'
        }).$promise.then(function (result){
          // attempt to load all relationships to stop a new API request 
          // from being made with each click on different related module
          subtechnique._alerts = result.alerts;
          subtechnique._incidents = result.incidents;
          subtechnique['_' + module_name + '_processing'] = false;
        });
      }
    }

    function toggleHiddenTechniques(tactic) {
      tactic._hide_techniques = !tactic._hide_techniques;
      if (!tactic._hide_techniques) {
        angular.forEach(tactic.techniques.value, function(technique) {
          technique._hide = false;
          technique._hide_by_group = false;
        });
      }
      else {
        angular.forEach(tactic.techniques.value, function(technique) {
          if (technique._subtechniqueCount == 0 && technique._alertCount == 0 && technique._incidentCount == 0) {
            technique._hide = true;
          }
          if (technique._intersection_groups != undefined && technique._intersection_groups.length == 0 &&
              $scope.config.selectedGroups != undefined && $scope.config.selectedGroups.length != 0) {
            technique._hide_by_group = true;
          }
        });
      }
    }
    function toggleHiddenTactics() {
      // we should only toggle already hidden ones so we need an extra flag to keep track
      $scope.tacticsRecords._toggled = !$scope.tacticsRecords._toggled;
      angular.forEach($scope.tacticsRecords, function(tactic) {
        if (tactic._hidden_techniques_count == tactic.techniques.value.length) {
          tactic._toggled = !tactic._toggled;
        }
      });
    }

    function getSeverityPicklist() {
      Modules.get({
        module: 'picklist_names',
        id: '4e80cba3-032f-48b4-ac03-17e3ec247aac' // default severity picklist
      }).$promise.then(function (result){
        $scope.severity = result.picklists;
      });
    }

    function getSeverity(record) {
      var severity_value = 'None';
      var color_value = {color: 'white'};
      angular.forEach($scope.severity, function(severity) {
        if (record.severity == severity['@id']) {
          severity_value = severity.itemValue;
          color_value = {
            'background-color': severity.color,
            'padding': '2px'
          };
        }
      });
      return [severity_value, color_value];
    }

    function openRecord(module, id) {
      var state = appModulesService.getState(module);
      var params = {
        module: module,
        id: $filter("getEndPathName")(id),
        previousState: $state.current.name,
        previousParams: JSON.stringify($state.params),
      };
      $state.go(state, params);
    }

    function showInDetailView(){
      // check alert/incident for any related technique/subtechnique
      // to determine what needs to be shown in detail view
      if ($scope.record_module == 'alerts') {
        Modules.get({
          module: $scope.alerts.module,
          id: $scope.record_uuid,
          $limit: $scope.alerts.query.limit,
          $relationships: true,
          __selectFields: 'mitre_techniques,mitre_sub_techniques'
        }).$promise.then(function (result) {
          if (result.mitre_techniques.length != 0) {
            var techniques_array = [];
            angular.forEach(result.mitre_techniques, function(technique) {
              techniques_array.push(technique['@id']);
            });
            $scope.record_relationships = techniques_array;
          }
          else if (result.mitre_sub_techniques != 0) {
            var subtechniques_array = [];
            angular.forEach(result.mitre_sub_techniques, function(subtechnique) {
              subtechniques_array.push(subtechnique.parentTechnique);
            });
            $scope.record_relationships = subtechniques_array;
          }
          $scope.findRelatedTactics();
        });
      }
      else if ($scope.record_module == 'incidents') {
        Modules.get({
          module: $scope.incidents.module,
          id: $scope.record_uuid,
          $limit: $scope.incidents.query.limit,
          $relationships: true,
          __selectFields: 'mitre_techniques,mitre_sub_techniques'
        }).$promise.then(function (result) {
          if (result.mitre_techniques.length != 0) {
            var techniques_array = [];
            angular.forEach(result.mitre_techniques, function(technique) {
              techniques_array.push(technique['@id']);
            });
            $scope.record_relationships = techniques_array;
          }
          else if (result.mitre_sub_techniques != 0) {
            var subtechniques_array = [];
            angular.forEach(result.mitre_sub_techniques, function(subtechnique) {
              subtechniques_array.push(subtechnique.parentTechnique);
            });
            $scope.record_relationships = subtechniques_array;
          }
          $scope.findRelatedTactics();
        });
      }
    }

    function findRelatedTactics() {
      if ($scope.record_relationships.length == 0){
        $scope.detail_not_found = true;
      }
      else {
        angular.forEach($scope.record_relationships, function(technique_id) {
          Modules.get({
            module: $scope.techniques.module,
            id: technique_id.split('/')[4],
            $limit: $scope.techniques.query.limit,
            $relationships: true,
            __selectFields: 'tactics'
          }).$promise.then(function (result) {
            angular.forEach(result.tactics, function(tactic) {
              $scope.related_tactics.push(tactic['@id']);
            });
          });
        });
      }
    }

    function loadGroupRelationships(technique, tactic_record) {
      var technique_groups = [];
      Modules.get({
        module: $scope.techniques.module,
        id: technique.uuid,
        $limit: $scope.techniques.query.limit,
        $relationships: true
      }).$promise.then(function (result) {
        angular.forEach(result.groups, function(group) {
          technique_groups.push(group.uuid);
        });
        technique._intersection_groups = _.intersection(technique_groups, $scope.config.selectedGroups);
        if (technique._intersection_groups.length == 0) {
          technique._hide_by_group = true;
          if (!technique._hide) {
            tactic_record._hidden_techniques_count++;
          }
        }
      });
    }

    function globalRefresh(){
      init();
    }
  }
})();
