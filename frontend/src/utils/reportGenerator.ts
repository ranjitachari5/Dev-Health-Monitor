import { ScanResponse } from '../types';

export function generateHealthReport(scanData: ScanResponse): void {
  const { summary, results, stack_name } = scanData;
  const healthPercentage = summary.total > 0 ? Math.round((summary.ok / summary.total) * 100) : 0;
  
  let report = `=======================================\n`;
  report += `      System Health Report\n`;
  report += `=======================================\n\n`;
  report += `Project Stack: ${stack_name}\n`;
  report += `Date: ${new Date().toLocaleString()}\n`;
  report += `Health Score: ${healthPercentage}%\n\n`;
  
  report += `--- Summary ---\n`;
  report += `Total Dependencies Required: ${summary.total}\n`;
  report += `Installed (OK): ${summary.ok}\n`;
  report += `Missing: ${summary.missing}\n`;
  report += `Outdated: ${summary.outdated}\n\n`;

  report += `--- Required Dependencies ---\n`;
  results.forEach(tool => {
    report += `- ${tool.display_name} (${tool.category})\n`;
    report += `  Status: ${tool.status.toUpperCase()}\n`;
    if (tool.installed_version) {
      report += `  Installed Version: ${tool.installed_version}\n`;
    }
    if (tool.min_version) {
      report += `  Required Version: ${tool.min_version}\n`;
    }
    if (tool.status !== 'ok') {
      report += `  Install URL: ${tool.install_url}\n`;
    }
    report += `\n`;
  });

  const missingOrOutdated = results.filter(t => t.status !== 'ok');
  if (missingOrOutdated.length > 0) {
    report += `--- Action Required (Missing / Outdated) ---\n`;
    missingOrOutdated.forEach(tool => {
      report += `- ${tool.display_name}: please visit ${tool.install_url}\n`;
    });
  } else {
    report += `--- Action Required ---\n`;
    report += `All systems go! No action required.\n`;
  }

  // Trigger download as a text file
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Create a safe, clean filename based on the stack name
  const safeName = stack_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `${safeName}_health_report.txt`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
