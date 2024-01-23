/* Copyright start
  Copyright (C) 2008 - 2022 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('mitreAttackSpread101Ctrl', mitreAttackSpread101Ctrl);

  mitreAttackSpread101Ctrl.$inject = ['$scope', 'appModulesService', 'currentPermissionsService', 'usersService',
    '$state', '$filter', 'ALL_RECORDS_SIZE', 'API', '$resource', '_', '$q', 'Query'
  ];

  function mitreAttackSpread101Ctrl($scope, appModulesService, currentPermissionsService, usersService,
    $state, $filter, ALL_RECORDS_SIZE, API, $resource, _, $q, Query) {

    // the relationship fields do not seem to follow a standard naming convention as seen below
    // we might want to fix these in the solution pack
    $scope.tactics = {
      "module": "mitre_tactics",
      "query": {
        "__selectFields": ["name", "mitreId", "techniques"],
        "sort": [
          {
            "field": "mitreId",
            "direction": "asc"
          }]
      }
    };
    $scope.techniques = { "module": "mitre_techniques", "query": { "__selectFields": ["name", "mitreId", "techniques", "alerts", "incidents"] } };
    $scope.subtechniques = { "module": "mitre_sub_techniques", "query": { "__selectFields": ["name", "mitreId", "parentTechnique"] } };
    // only pull alerts and incidents that have techniques or subtechniques linked
    $scope.alerts = {
      "module": "alerts",
      "query": {
        "__selectFields": ["name", "severity", "mitre_techniques", "mitre_sub_techniques"],
        "logic": "OR",
        "filters": [
          {
            "type": "primitive",
            "field": "mitre_techniques",
            "value": "false",
            "operator": "isnull",
            "_operator": "isnull"
          },
          {
            "type": "primitive",
            "field": "mitre_sub_techniques",
            "value": "false",
            "operator": "isnull",
            "_operator": "isnull"
          }
        ]
      }
    };

    if ($scope.config.alertsQuery != undefined && $scope.config.alertsQuery.filters.length != 0 ) {
      var old_alerts_filter = {"logic" : $scope.alerts.query.logic, "filters" : $scope.alerts.query.filters};
      $scope.alerts.query.logic = "AND";
      var _query  = new Query($scope.config.alertsQuery);
      $scope.alerts.query.filters = [old_alerts_filter, _query.getQuery(true)];
    }

    $scope.incidents = {
      "module": "incidents",
      "query": {
        "__selectFields": ["name", "severity", "mitretechniques", "mitresubtechniques"],
        "logic": "OR",
        "filters": [
          {
            "type": "primitive",
            "field": "mitretechniques",
            "value": "false",
            "operator": "isnull",
            "_operator": "isnull"
          },
          {
            "type": "primitive",
            "field": "mitresubtechniques",
            "value": "false",
            "operator": "isnull",
            "_operator": "isnull"
          }
        ]
      }
    };


    if ($scope.config.incidentsQuery != undefined && $scope.config.incidentsQuery.filters.length != 0) {
      var old_incidents_filter = {"logic": $scope.incidents.query.logic, "filters": $scope.incidents.query.filters};
      $scope.incidents.query.logic = "AND";
      var _query  = new Query($scope.config.incidentsQuery);
      $scope.incidents.query.filters = [old_incidents_filter, _query.getQuery(true)];
    }

    // the query is changed for the details page
    if ($state.params.page.includes('detail') && $state.params.module === $scope.incidents.module) {
      $scope.incidents = {
        "module": "incidents",
        "query": {
          "__selectFields": ["name", "severity", "mitretechniques", "mitresubtechniques"],
          "logic": "AND",
          "filters": [
            {
              "field": "uuid",
              "value": $state.params.id,
              "operator": "eq",
            },
            {
              "logic": "OR",
              "filters": [
                {
                  "type": "primitive",
                  "field": "mitretechniques",
                  "value": "false",
                  "operator": "isnull",
                  "_operator": "isnull"
                },
                {
                  "type": "primitive",
                  "field": "mitresubtechniques",
                  "value": "false",
                  "operator": "isnull",
                  "_operator": "isnull"
                }
              ]
            }
          ]
        }
      };

      if ($scope.config.incidentsQuery != undefined && $scope.config.incidentsQuery.filters.length != 0) {
        $scope.incidents.query.filters.push($scope.config.incidentsQuery);
      }

      $scope.alerts = {
        "module": "alerts",
        "query": {
          "__selectFields": ["name", "severity", "mitre_techniques", "mitre_sub_techniques"],
          "logic": "AND",
          "filters": [
            {
              "field": "incidents.uuid",
              "value": $state.params.id,
              "operator": "eq",
            },
            {
              "logic": "OR",
              "filters": [
                {
                  "type": "primitive",
                  "field": "mitre_techniques",
                  "value": "false",
                  "operator": "isnull",
                  "_operator": "isnull"
                },
                {
                  "type": "primitive",
                  "field": "mitre_sub_techniques",
                  "value": "false",
                  "operator": "isnull",
                  "_operator": "isnull"
                }
              ]
            }
          ]
        }
      };

      if ($scope.config.alertsQuery != undefined && $scope.config.alertsQuery.filters.length != 0) {
        $scope.alerts.query.filters.push($scope.config.alertsQuery);
      }
    }

    $scope.getTactics = getTactics;
    $scope.getSeverity = getSeverity;
    $scope.tacticsPermissions = currentPermissionsService.getPermission($scope.tactics.module);
    $scope.techniquesPermissions = currentPermissionsService.getPermission($scope.techniques.module);
    $scope.subtechniquesPermissions = currentPermissionsService.getPermission($scope.subtechniques.module);
    $scope.openRecord = openRecord;
    $scope.toggleShowRelationships = toggleShowRelationships;
    $scope.toggleShowSubtechniqueRelationships = toggleShowSubtechniqueRelationships;
    $scope.showDetailView = showDetailView;
    $scope.detail_display = false;
    $scope.record_relationships = [];
    $scope.detail_not_found = false;
    $scope.detail_linked_alerts = [];
    $scope.detail_linked_incidents = [];
    $scope.related_tactics = [];
    $scope.currentUser = usersService.getCurrentUser();
    $scope.currentTheme = 'dark';
    $scope.changeMatrix = changeMatrix;
    $scope.globalRefresh = globalRefresh;
    $scope.hide_all = false;

    if (!$scope.tacticsPermissions.read || !$scope.techniquesPermissions.read || !$scope.subtechniquesPermissions.read) {
      $scope.unauthorized = true;
      return;
    }

    $scope.tactics_order = ['TA0043', 'TA0042', 'TA0001', 'TA0002', 'TA0003', 'TA0004', // enterprise
      'TA0005', 'TA0006', 'TA0007', 'TA0008', 'TA0009', 'TA0011',
      'TA0010', 'TA0040',
      'TA0027', 'TA0041', 'TA0028', 'TA0029', 'TA0030', 'TA0031', // mobile
      'TA0032', 'TA0033', 'TA0035', 'TA0037', 'TA0036', 'TA0034',
      'TA0038', 'TA0039',
      'TA0108', 'TA0104', 'TA0110', 'TA0111', 'TA0103', 'TA0102', // ics
      'TA0109', 'TA0100', 'TA0101', 'TA0107', 'TA0106', 'TA0105'];
    $scope.enterprise_list = $scope.tactics_order.slice(0, 14);
    $scope.mobile_list = $scope.tactics_order.slice(14, 28);
    $scope.ics_list = $scope.tactics_order.slice(28);
    $scope.selectedMatrix = 'enterprise';
    $scope.selected_list = $scope.enterprise_list;

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
        // enforce the coverage filter toggle to make techniques more visible
        $scope.config.enableCoverage = true;
        // only incidents can be viewed in detail view
        if ($state.params.module != 'incidents') {
          $scope.hide_all = true;
        }
      }
      $scope.getTactics();
    }

    function getTactics() {
      $scope.processing = true;
      var tactics_api_call = $resource(API.QUERY + $scope.tactics.module + '?$limit=' + ALL_RECORDS_SIZE).save($scope.tactics.query).$promise.then(function (response) {
        $scope.tacticsRecords = response['hydra:member'];
        $scope.tacticsRecords._total_hidden = 0;
        $scope.tacticsRecords._toggled = $scope.config.hideTactics || $scope.config.hideParentTactics; // hide tactics if the filter is toggled on
        return $scope.tacticsRecords;
      });

      var subtechniques_api_call = $resource(API.QUERY + $scope.subtechniques.module + '?$limit=' + ALL_RECORDS_SIZE + '&$export=true').save($scope.subtechniques.query).$promise.then(function (response) {
        $scope.subtechniquesRecords = response['hydra:member'];
        return $scope.subtechniquesRecords;
      });

      var alerts_api_call = $resource(API.QUERY + $scope.alerts.module + '?$limit=' + ALL_RECORDS_SIZE).save($scope.alerts.query).$promise.then(function (response) {
        $scope.alertsRecords = response['hydra:member'];
        return $scope.alertsRecords;
      });

      var incidents_api_call = $resource(API.QUERY + $scope.incidents.module + '?$limit=' + ALL_RECORDS_SIZE).save($scope.incidents.query).$promise.then(function (response) {
        $scope.incidentsRecords = response['hydra:member'];
        return $scope.incidentsRecords;
      });

      $q.all([tactics_api_call, subtechniques_api_call, alerts_api_call, incidents_api_call]).then(function () {

        // merge alerts/incidents with subtechniques
        angular.forEach($scope.subtechniquesRecords, function (subtechnique) {
          subtechnique._alerts = [];
          angular.forEach($scope.alertsRecords, function (alert) {
            angular.forEach(alert.mitre_sub_techniques, function (subtechnique_record) {
              if (subtechnique_record.uuid == subtechnique.uuid) {
                var alert_severity_array = getSeverity(alert);
                alert._severity_value = alert_severity_array[0];
                alert._severity_color = alert_severity_array[1];

                subtechnique._alerts.push(alert);
              }
            });
          });
          subtechnique._incidents = [];
          angular.forEach($scope.incidentsRecords, function (incident) {
            angular.forEach(incident.mitresubtechniques, function (incident_record) {
              if (incident_record.uuid == subtechnique.uuid) {
                subtechnique._incidents.push(incident);
              }
            });
          });
        });

        angular.forEach($scope.tacticsRecords, function (tactic) {

          tactic.techniques = _.sortBy(tactic.techniques, 'mitreId'); // sort each tactic's techniques based on mitreId

          tactic._toggled = false; // keeps track if the tactic itself should be hidden
          tactic._toggled_detail = false; // keeps track if the tactic itself should be hidden in detail view
          tactic._hide_techniques = false; // keeps track of the hide techniques toggle for every tactic
          tactic._hidden_techniques_count = 0; // how many techniques should be hidden per tactic

          // set order key for tactics to keep it aligned with MITRE's website
          tactic._order_key = _.indexOf($scope.tactics_order, tactic.mitreId);

          angular.forEach(tactic.techniques, function (technique) {
            technique._subtechniques = [];
            // merges subtechniques to tactics via techniques
            angular.forEach($scope.subtechniquesRecords, function (subtechnique_record) {
              if (subtechnique_record.parentTechnique != null) { // need this check otherwise it breaks the loop
                if (technique['@id'] == subtechnique_record.parentTechnique) {
                  // requires subtechnique object to be cloned
                  // otherwise clicking on one toggle shows/hides alerts and incidents across all duplicates
                  technique._subtechniques.push(structuredClone(subtechnique_record));
                }
              }
            });
            angular.forEach(technique._subtechniques, function (subtechnique) {
              // populates counts for alerts/incidents under subtechniques
              subtechnique._alertCount = subtechnique._alerts.length;
              subtechnique._incidentCount = subtechnique._incidents.length;

              // assign severity to alert/incidents
              if (subtechnique._alerts.length != 0) {
                angular.forEach(subtechnique._alerts, function (alert) {
                  var alert_severity_array = getSeverity(alert);
                  alert._severity_value = alert_severity_array[0];
                  alert._severity_color = alert_severity_array[1];

                  // detail view check
                  if ($scope.detail_display) {
                    $scope.related_tactics.push(tactic['@id']);
                  }
                });
              }
              if (subtechnique._incidents.length != 0) {
                angular.forEach(subtechnique._incidents, function (incident) {
                  var incident_severity_array = getSeverity(incident);
                  incident._severity_value = incident_severity_array[0];
                  incident._severity_color = incident_severity_array[1];

                  // detail view check
                  if ($scope.detail_display) {
                    $scope.related_tactics.push(tactic['@id']);
                  }
                });
              }

              // show all relationships immediately if it's being enforced by edit filters
              if ($scope.config.displaySubtechniques || $scope.config.enableCoverage) {
                if (subtechnique._alertCount > 0) {
                  toggleShowSubtechniqueRelationships(subtechnique, 'alerts', false);
                  technique._show_subtechniques_coverage = true;
                }
                if (subtechnique._incidentCount > 0) {
                  toggleShowSubtechniqueRelationships(subtechnique, 'incidents', false);
                  technique._show_subtechniques_coverage = true;
                }
              }
            });

            // merges alerts/incidents to techniques
            technique._alerts = [];
            angular.forEach($scope.alertsRecords, function (alert) {
              angular.forEach(alert.mitre_techniques, function (alert_technique) {
                if (alert_technique.uuid == technique.uuid) {
                  // populate alert severity
                  var alert_severity_array = getSeverity(alert);
                  alert._severity_value = alert_severity_array[0];
                  alert._severity_color = alert_severity_array[1];

                  technique._alerts.push(alert);

                  // detail view check
                  if ($scope.detail_display) {
                    $scope.related_tactics.push(tactic['@id']);
                  }
                }
              });
            });
            technique._incidents = [];
            angular.forEach($scope.incidentsRecords, function (incident) {
              angular.forEach(incident.mitretechniques, function (incident_technique) {
                if (incident_technique.uuid == technique.uuid) {
                  // populate incident severity
                  var incident_severity_array = getSeverity(incident);
                  incident._severity_value = incident_severity_array[0];
                  incident._severity_color = incident_severity_array[1];

                  technique._incidents.push(incident);

                  // detail view check
                  if ($scope.detail_display) {
                    $scope.related_tactics.push(tactic['@id']);
                  }
                }
              });
            });

            // populates counts for alerts/incidents under techniques
            technique._subtechniqueCount = technique._subtechniques.length;
            technique._alertCount = technique._alerts.length;
            technique._incidentCount = technique._incidents.length;

            // hide techniques if hide empty techniques toggle is turned on
            if ($scope.config.hideTechniques) {
              if (technique._subtechniqueCount == 0 && technique._alertCount == 0 && technique._incidentCount == 0) {
                technique._hide = true;
                tactic._hide_techniques = true;
                tactic._hidden_techniques_count++;
              }
              else {
                technique._hide = false;
              }
            }

            // filter techniques by groups if the groups filter is active
            technique._hide_by_group = false;
            if ($scope.config.selectedGroups != undefined && $scope.config.selectedGroups.length != 0) {
              technique._hide_by_group = true;
              $scope.config.previousGroups = $scope.config.selectedGroups;
              angular.forEach($scope.config.groupsRecords, function (group) {
                if (group.techniques.includes(technique['@id'])) {
                  if ($scope.config.selectedGroups.includes(group.name + ' (' + group.mitreId + ')')) {
                    technique._hide_by_group = false;
                  }
                }
              });
              if (technique._hide_by_group && !technique._hide) {
                tactic._hidden_techniques_count++;
              }
            }

            // show all relationships immediately if it's being enforced by edit filters
            if ($scope.config.displayTechniques || $scope.config.enableCoverage) {
              if (technique._subtechniqueCount > 0) {
                toggleShowRelationships(technique, 'subtechniques', false);
              }
              if (technique._alertCount > 0) {
                toggleShowRelationships(technique, 'alerts', false);
              }
              if (technique._incidentCount > 0) {
                toggleShowRelationships(technique, 'incidents', false);
              }
            }
          });

          // show/hide tactic based on alert or incident relationship in detail view
          if ($scope.detail_display && $scope.related_tactics.length != 0) {
            if ($scope.related_tactics.includes(tactic['@id'])) {
              tactic._toggled_detail = true;
            }
          }

        });

        $scope.processing = false;
      }, angular.noop).finally(function () {
        $scope.processing = false;
      });
    }

    function toggleShowRelationships(technique, module_name, clicked) {
      if (technique['_show_' + module_name] === undefined || !technique['_show_' + module_name]) {
        // show relationships
        technique['_show_' + module_name] = true;
        if ($scope.config.enableCoverage) {
          // we need to switch this flag off when coverage filter is on
          // since the _show_subtechniques_coverage flag will take care of it
          technique._show_subtechniques = false;
        }
        if (clicked) {
          // however if the subtechniques link is clicked by the user to toggle relationships
          // we need to switch it back on for techniques that aren't marked by the coverage filter
          technique['_show_' + module_name] = true;
        }
      }
      else if (technique['_show_' + module_name]) {
        // hide relationships
        technique['_show_' + module_name] = false;
        technique['_' + module_name + '_processing'] = false;
      }
    }

    function toggleShowSubtechniqueRelationships(subtechnique, module_name, clicked) {
      if (subtechnique['_show_' + module_name] === undefined || !subtechnique['_show_' + module_name]) {
        // show relationships
        subtechnique['_show_' + module_name] = true;
      }
      else if (subtechnique['_show_' + module_name]) {
        // hide relationships
        subtechnique['_show_' + module_name] = false;
        subtechnique['_' + module_name + '_processing'] = false;
      }
      if (!clicked) {
        // this override will run if filters are enforcing every relationship to be displayed on init
        subtechnique['_show_' + module_name] = true;
      }
    }

    function showDetailView(record, alert_collection, incident_collection) {
      angular.forEach(alert_collection, function (alert) {
        if (record.alerts != undefined && record.alerts.length != 0) {
          angular.forEach(record.alerts, function (detail_alert) {
            if (detail_alert == alert['@id']) {
              $scope.detail_linked_alerts.push(detail_alert);
            }
          });
        }
      });
      angular.forEach(incident_collection, function (incident) {
        if (record.incidents != undefined && record.incidents.length != 0) {
          angular.forEach(record.incidents, function (detail_incident) {
            if (detail_incident == incident['@id']) {
              $scope.detail_linked_incidents.push(detail_incident);
            }
          });
        }
      });
      return $scope.detail_linked_alerts.concat($scope.detail_linked_incidents);
    }

    function getSeverity(record) {
      var severity_value = 'None';
      var color_value = { color: 'white' };
      severity_value = record.severity ? record.severity.itemValue : 'None'; //null severity throws error 
      color_value = {
        'background-color': record.severity ? record.severity.color : 'transparent', //null severity throws error 
        'padding': '2px'
      };
      return [severity_value, color_value];
    }

    function openRecord(module, id) {
      // subtechniques were pulled via export=true flag so we need to reconstruct @id
      if (module == 'mitre_sub_techniques') {
        id = '/api/3/' + module + '/' + id;
      }
      var state = appModulesService.getState(module);
      var params = {
        module: module,
        id: $filter("getEndPathName")(id),
        previousState: $state.current.name,
        previousParams: JSON.stringify($state.params),
      };
      $state.go(state, params);
    }

    function changeMatrix(selectedMatrix) {
      if (selectedMatrix === 'mobile') {
        $scope.selected_list = $scope.mobile_list;
      }
      else if (selectedMatrix === 'ics') {
        $scope.selected_list = $scope.ics_list;
      }
      else {
        $scope.selected_list = $scope.enterprise_list;
      }
    }

    function globalRefresh() {
      init();
    }
  }
})();
