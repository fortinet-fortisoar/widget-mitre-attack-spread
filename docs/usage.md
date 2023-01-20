| [Home](../README.md) |
|--------------------------------------------|

# Usage


**MITRE ATT&CK Alert Incident Spread Widget Edit View**:

<img src="https://raw.githubusercontent.com/fortinet-fortisoar/widget-mitre-attack-spread/develop/docs/media/edit_view.png" alt="Editing the MITRE ATT&CK Alert Incident Spread Widget" style="border: 1px solid #A9A9A9; border-radius: 4px; padding: 10px; display: block; margin-left: auto; margin-right: auto;">

**MITRE ATT&CK Alert Incident Spread Widget - Dashboard View**:
<img src="https://raw.githubusercontent.com/fortinet-fortisoar/widget-mitre-attack-spread/develop/docs/media/dashboard_view.png" alt="Viewing the MITRE ATT&CK Alert Incident Spread Widget on the Dashboard page" style="border: 1px solid #A9A9A9; border-radius: 4px; padding: 10px; display: block; margin-left: auto; margin-right: auto;">

Prerequisites to using the MITRE ATT&CK Alert Incident Spread Widget:

- Make sure MITRE ATT&CK Enrichment Framework is installed via Content Hub. This will install all necessary MITRE ATT&CK modules and the MITRE ATT&CK Connector responsible for ingesting MITRE ATT&CK records into your FortiSOAR environment.
- Make sure MITRE ATT&CK Connector's ingestion is configured and is executed at least once to ingest MITRE ATT&CK records to be displayed on the widget.
- All MITRE ATT&CK module read permissions are required for the widget to be visible and operable.

The following details are displayed by the MITRE ATT&CK Alert Incident Spread Widget's Dashboard View:

- The first row consists of MITRE ATT&CK Tactics found in the FortiSOAR environment. The number of Tactics visible in the widget can look different based on which MITRE ATT&CK Matrices you decided to perform ingestion with as well as the filters enabled on the widget. In our screenshot example we have both "Hide Empty Tactics" and "Hide Tactics If All Related Techniques Are Hidden" filters enabled, which causes some Tactics to be hidden. This can be overridden at will by clicking the "Show Hidden Tactics" button found above the widget table to display all Tactics available in your FortiSOAR environment regardless of the filter settings on the widget. 
- The following rows display MITRE ATT&CK Technique information and shows if these Techniques have any linked Subtechniques, Alerts, or Incidents. If there's a link available, clicking on them will expand the cell and reveal information about the linked record(s). 
- MITRE ATT&CK Subtechniques are handled the same way where they can also have unique Alerts and/or Incidents linked independent from the parent Technique. Clicking on any available links will expand the cell even further and display information about the Alert(s) and Incident(s).
- Alerts and Incidents will have their severity information displayed along with their names to make it easier for the user to gauge whether there's a critical case to respond. In the screenshot you can also observe that the heatmap filter is turned on that will highlight all of the Alerts and Incidents available on the widget to draw immediate attention.

