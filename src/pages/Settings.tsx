import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Upload,
  Lock,
  Globe,
  Sliders,
  CheckCircle,
  Save,
  KeyRound,
  Trash2
} from 'lucide-react';

type TabType = 'general' | 'upload' | 'security';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isSaved, setIsSaved] = useState(false);

  // General Settings state mockup
  const [siteName, setSiteName] = useState('NotesSharing Platform');
  const [pageLimit, setPageLimit] = useState('25');
  const [systemLogs, setSystemLogs] = useState('Enabled');

  // Upload limitations mockup
  const [maxFileSize, setMaxFileSize] = useState(25);
  const [scanFiles, setScanFiles] = useState(true);

  // Security credentials mockup list
  const [apiKeys, setApiKeys] = useState([
    { id: 'KEY01', label: 'Primary Client iOS APP', value: 'ns_live_382a8...fce12', role: 'Read Only' },
    { id: 'KEY02', label: 'Production Backend Server Link', value: 'ns_live_aef88...9834d', role: 'Full Access' },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const deleteKey = (id: string) => {
    if (window.confirm('Delete this API Token? Connected apps will lose access.')) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight font-heading">Console Settings</h2>
        <p className="text-sm text-muted-foreground font-medium">
          Modify core registry variables, set data constraints, and manage system security tokens.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Tabs */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1.5 p-1 bg-accent/40 rounded-xl border border-border lg:h-fit">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold w-full transition-all duration-150
              ${activeTab === 'general'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }
            `}
          >
            <Globe className="h-4 w-4" />
            General Setup
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold w-full transition-all duration-150
              ${activeTab === 'upload'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }
            `}
          >
            <Upload className="h-4 w-4" />
            Upload Controls
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold w-full transition-all duration-150
              ${activeTab === 'security'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }
            `}
          >
            <Lock className="h-4 w-4" />
            Security & API Keys
          </button>
        </aside>

        {/* Configurations pane */}
        <div className="flex-1">
          <form onSubmit={handleSave}>
            {/* General Tab */}
            {activeTab === 'general' && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" /> General Platform Settings
                  </CardTitle>
                  <CardDescription>Setup main UI descriptors and default table limits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Platform Brand Title
                    </label>
                    <Input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Select
                        label="Records Per Page Limit"
                        value={pageLimit}
                        onChange={(e) => setPageLimit(e.target.value)}
                      >
                        <option value="10">10 Rows</option>
                        <option value="25">25 Rows</option>
                        <option value="50">50 Rows</option>
                        <option value="100">100 Rows</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Select
                        label="Moderator Logs Status"
                        value={systemLogs}
                        onChange={(e) => setSystemLogs(e.target.value)}
                      >
                        <option value="Enabled">Enabled (Write all edits to memory)</option>
                        <option value="Disabled">Disabled (Off)</option>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/60 pt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Values cached locally in the console layer.</span>
                  <Button type="submit" size="sm" className="flex gap-1.5 items-center bg-primary hover:bg-primary/95 text-white">
                    {isSaved ? (
                      <>
                        <CheckCircle className="h-4 w-4" /> Changes Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save General Configuration
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" /> Resource Upload Boundaries
                  </CardTitle>
                  <CardDescription>Determine acceptable parameters for document submissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Maximum Allowed File Size (MB)
                    </label>
                    <Input
                      type="number"
                      value={maxFileSize}
                      onChange={(e) => setMaxFileSize(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Supported File Formats
                    </label>
                    <div className="grid grid-cols-2 gap-3 bg-accent/20 p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" defaultChecked className="rounded border-input text-primary focus:ring-ring h-4 w-4" />
                        <span>PDF (.pdf)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" defaultChecked className="rounded border-input text-primary focus:ring-ring h-4 w-4" />
                        <span>ZIP Archive (.zip)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" defaultChecked className="rounded border-input text-primary focus:ring-ring h-4 w-4" />
                        <span>Word Docs (.docx)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" className="rounded border-input text-primary focus:ring-ring h-4 w-4" />
                        <span>Images (.png, .jpg)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-accent/40 rounded-xl border border-border/80">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Anti-Malware File Scan</h4>
                      <p className="text-xs text-muted-foreground">Scan all uploaded documents for virus signatures upon upload.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScanFiles(!scanFiles)}
                      className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none flex ${scanFiles ? 'bg-primary justify-end' : 'bg-muted-foreground/35 justify-start'}`}
                    >
                      <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/60 pt-4 flex justify-end">
                  <Button type="submit" size="sm" className="flex gap-1.5 items-center bg-primary hover:bg-primary/95 text-white">
                    {isSaved ? (
                      <>
                        <CheckCircle className="h-4 w-4" /> Constraints Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Upload Limits
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Security/Keys Tab */}
            {activeTab === 'security' && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" /> API Token Registry
                  </CardTitle>
                  <CardDescription>Generate and manage secure public links for application frontends.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="divide-y divide-border">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground/90">{key.label}</span>
                            <Badge variant="secondary" className="text-[9px] font-semibold">{key.role}</Badge>
                          </div>
                          <code className="text-xs font-mono text-muted-foreground block truncate">{key.value}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteKey(key.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" type="button" className="text-xs mt-2">
                    + Generate New API Token
                  </Button>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
