| [Home](../README.md) |
|--------------------------------------------|

# Installation
1. To install a widget, click **Content Hub** > **Discover**.
2. From the list of widget that appears, search for **MITRE ATT&CK Alert Incident Spread Widget**.
3. Click the **MITRE ATT&CK Alert Incident Spread Widget** widget card.
4. Click **Install** on the lower part of the screen to begin installation.

# Prerequisites

Following are the prerequisites to using the **MITRE ATT&CK Alert Incident Spread** widget:

1. Install [MITRE ATT&CK Enrichment Framework](https://fortisoar.contenthub.fortinet.com//detail.html?entity=mITREATT%26CKEnrichmentFramework&version=2.2.0&type=solutionpack) for related MITRE ATT&CK ingestion modules.
2. Configure MITRE ATT&CK connector's data ingestion.
3. Ingest data using the connector to display MITRE ATT&CK records on the widget.
4. Assign read permission to all MITRE ATT&CK related modules.

# Configuration

Specify following details to customize the **MITRE ATT&CK Alert Incident Spread** widget to suit your requirements:

| Fields                           | Description                                                                                                                           |
|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Title                            | Specify the optional custom heading or a title for the widget.                                                                        |
| Show Alert and Incident Coverage | An optional toggle to highlight and expand Techniques and Subtechniques with linked alerts and incidents.                             |
| Expand All Techniques            | An optional toggle to expand all MITRE ATT&CK Technique cells for a broader view of its related records.                              |
| Hide Empty Tactics               | An optional toggle to hide all MITRE ATT&CK Tactics from view if they do not have any related Techniques.                             |
| Hide Empty Techniques            | An optional toggle to hide all MITRE ATT&CK Techniques from view if they do not have any related Subtechniques, Alerts, or Incidents. |
| Filter Based On Groups           | An optional toggle to show/hide MITRE ATT&CK Techniques if they are related to at least one of the selected Groups.                   |
| Alerts Filter Criteria           | Helps filter Alerts on the widget table by any Alert field or a combination of fields.                                                |
| Incidents Filter Criteria        | Helps filter Incidents on the widget table by any Incident field or a combination of fields.                                          |

## Next Steps

| [Usage](./usage.md) |
|---------------------|