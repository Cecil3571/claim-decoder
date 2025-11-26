import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, ArrowRight, FileText, ShieldAlert, ShieldCheck, AlertTriangle, Check, X, Loader2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { analyzePolicy as realAnalyzePolicy, analyzeUnderpayment as realAnalyzeUnderpayment } from "@/lib/api-service";
import { type PolicyData, type CoverageAnalysis, type UnderpaymentRisk } from "@/lib/mock-service";

// --- Zod Schemas ---
const analysisFormSchema = z.object({
  state: z.string().min(1, "State is required"),
  policyType: z.string().min(1, "Policy type is required"),
  lossDescription: z.string().min(10, "Please describe the loss in more detail"),
});

type AnalysisFormValues = z.infer<typeof analysisFormSchema>;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<"upload" | "results">("upload");
  
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState<PolicyData | null>(null);
  const [coverageAnalysis, setCoverageAnalysis] = useState<CoverageAnalysis | null>(null);
  const [underpaymentRisk, setUnderpaymentRisk] = useState<UnderpaymentRisk | null>(null);
  const [isCheckingRisk, setIsCheckingRisk] = useState(false);
  const [estimateText, setEstimateText] = useState("");

  const { toast } = useToast();

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      state: "",
      policyType: "",
      lossDescription: "",
    },
  });

  const onSubmit = async (values: AnalysisFormValues) => {
    if (!file) {
      toast({
        title: "No file uploaded",
        description: "Please upload a policy PDF to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await realAnalyzePolicy(file, values.state, values.policyType, values.lossDescription);
      setAnalysisId(result.id);
      setPolicyData(result.policy);
      setCoverageAnalysis(result.analysis);
      setStep("results");
      toast({
        title: "Analysis Complete",
        description: "Policy successfully decoded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRiskCheck = async () => {
    if (!estimateText.trim() || !analysisId) return;
    
    setIsCheckingRisk(true);
    try {
      const result = await realAnalyzeUnderpayment(analysisId, estimateText);
      setUnderpaymentRisk(result);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check underpayment risk.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingRisk(false);
    }
  };

  const handleDownload = () => {
    const content = `
POLICY DECODER REPORT
---------------------
Date: ${new Date().toLocaleDateString()}
Policy Type: ${policyData?.policy_type}

--- LIMITS ---
Dwelling: ${policyData?.limits.dwelling}
Other Structures: ${policyData?.limits.other_structures}
Personal Property: ${policyData?.limits.personal_property}
Loss of Use: ${policyData?.limits.loss_of_use_ALE}

--- DEDUCTIBLES ---
All Peril: ${policyData?.deductibles.all_peril}
Hurricane: ${policyData?.deductibles.hurricane_wind}

--- COVERAGE ANALYSIS ---
Summary: ${coverageAnalysis?.coverage_summary}

COVERED:
${coverageAnalysis?.covered_aspects.map(x => `- ${x}`).join('\n')}

EXCLUDED:
${coverageAnalysis?.excluded_aspects.map(x => `- ${x}`).join('\n')}

AMBIGUOUS:
${coverageAnalysis?.ambiguous_points.map(x => `- ${x}`).join('\n')}

--- UNDERPAYMENT RISK ---
${underpaymentRisk ? underpaymentRisk.summary : "Not analyzed"}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'policy-decoder-report.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (step === "results" && policyData && coverageAnalysis) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">MVP Build</Badge>
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
                  {policyData.policy_type}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-glow">Analysis Results</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")} className="border-border bg-card hover:bg-accent/10">
                Start Over
              </Button>
              <Button onClick={handleDownload} className="gap-2 shadow-lg shadow-primary/20">
                <Download className="h-4 w-4" /> Export Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Policy Summary */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="glass-panel border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Policy Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Dwelling (A)</p>
                      <p className="font-mono font-semibold text-foreground">{policyData.limits.dwelling}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Other Structures (B)</p>
                      <p className="font-mono font-semibold text-foreground">{policyData.limits.other_structures}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Personal Prop (C)</p>
                      <p className="font-mono font-semibold text-foreground">{policyData.limits.personal_property}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Loss of Use (D)</p>
                      <p className="font-mono font-semibold text-foreground">{policyData.limits.loss_of_use_ALE}</p>
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                   <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Liability (E)</p>
                      <p className="font-mono font-semibold text-foreground">{policyData.limits.liability}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Med Pay (F)</p>
                      <p className="font-mono font-semibold text-foreground">{policyData.limits.medical_payments}</p>
                    </div>
                   </div>
                </CardContent>
              </Card>

              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-lg">Deductibles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded bg-background/50 border border-border/30">
                    <span className="text-muted-foreground">All Peril</span>
                    <span className="font-mono font-bold">{policyData.deductibles.all_peril}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-background/50 border border-border/30">
                    <span className="text-muted-foreground">Hurricane</span>
                    <span className="font-mono font-bold text-warning">{policyData.deductibles.hurricane_wind}</span>
                  </div>
                   <div className="flex justify-between items-center p-2 rounded bg-background/50 border border-border/30">
                    <span className="text-muted-foreground">Hail</span>
                    <span className="font-mono font-bold">{policyData.deductibles.hail}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel">
                 <CardHeader>
                  <CardTitle className="text-lg">Key Endorsements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {policyData.key_endorsements.map((end, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{end}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Analysis */}
            <div className="lg:col-span-8 space-y-6">
              {/* Coverage Analysis */}
              <Card className="glass-panel overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-transparent p-1 h-1" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Coverage Analysis
                  </CardTitle>
                  <CardDescription>Based on loss description: "{form.getValues().lossDescription}"</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-card/50 p-4 rounded-lg border border-border/50 text-sm leading-relaxed">
                    {coverageAnalysis.coverage_summary}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-success">
                        <Check className="h-4 w-4" /> Likely Covered
                      </h3>
                      <ul className="space-y-2">
                        {coverageAnalysis.covered_aspects.map((item, i) => (
                           <li key={i} className="text-sm text-muted-foreground bg-success/5 border border-success/10 p-2 rounded">
                             {item}
                           </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-destructive">
                        <X className="h-4 w-4" /> Excluded / Limited
                      </h3>
                      <ul className="space-y-2">
                        {coverageAnalysis.excluded_aspects.map((item, i) => (
                           <li key={i} className="text-sm text-muted-foreground bg-destructive/5 border border-destructive/10 p-2 rounded">
                             {item}
                           </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" /> Ambiguous / Needs Verification
                    </h3>
                    <ul className="space-y-2">
                      {coverageAnalysis.ambiguous_points.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground bg-warning/5 border border-warning/10 p-2 rounded flex gap-2">
                            <span className="shrink-0 text-warning mt-0.5">•</span> {item}
                          </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Underpayment Risk */}
              <Card className="glass-panel border-t-4 border-t-warning/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-warning" />
                    Underpayment Risk Check
                  </CardTitle>
                  <CardDescription>Paste the carrier's estimate to check for missing line items.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!underpaymentRisk ? (
                    <div className="space-y-4">
                      <Textarea 
                        placeholder="Paste carrier estimate text here..." 
                        className="min-h-[120px] font-mono text-sm bg-background/50 border-border/50 focus:border-warning/50 focus:ring-warning/20"
                        value={estimateText}
                        onChange={(e) => setEstimateText(e.target.value)}
                      />
                      <Button 
                        onClick={handleRiskCheck} 
                        disabled={isCheckingRisk || !estimateText}
                        className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                      >
                        {isCheckingRisk ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze Underpayment Risk"}
                      </Button>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg text-sm">
                        <p className="font-medium text-warning mb-1">Summary</p>
                        {underpaymentRisk.summary}
                      </div>

                      <div className="grid gap-4">
                         {underpaymentRisk.missing_categories.length > 0 && (
                           <div className="space-y-2">
                             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Potentially Missing</h4>
                             {underpaymentRisk.missing_categories.map((item, i) => (
                               <div key={i} className="p-3 rounded bg-card border border-border text-sm flex gap-3 items-start">
                                  <div className="h-2 w-2 rounded-full bg-warning mt-1.5 shrink-0" />
                                  {item}
                               </div>
                             ))}
                           </div>
                         )}
                         
                         {underpaymentRisk.suspicious_deductions.length > 0 && (
                           <div className="space-y-2">
                             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suspicious Deductions</h4>
                             {underpaymentRisk.suspicious_deductions.map((item, i) => (
                               <div key={i} className="p-3 rounded bg-card border border-border text-sm flex gap-3 items-start">
                                  <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                                  {item}
                               </div>
                             ))}
                           </div>
                         )}
                      </div>

                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => { setUnderpaymentRisk(null); setEstimateText(""); }}
                      >
                        Check Another Estimate
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-glow">Policy Decoder</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Upload a property insurance policy to instantly spot coverage gaps and underpayment risks.
            </p>
          </div>

          <Card className="glass-panel border-primary/10 shadow-2xl shadow-primary/5">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Step 1: File Upload */}
                  <div className="space-y-4">
                    <label className="text-base font-semibold text-foreground block">1. Upload Policy PDF</label>
                    <FileUpload 
                      selectedFile={file}
                      onFileSelect={(f) => {
                        setFile(f);
                        if(f) form.clearErrors("root"); 
                      }}
                    />
                  </div>

                  {/* Step 2: Details */}
                  <div className="grid md:grid-cols-2 gap-6 space-y-0">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jurisdiction (State)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FL">Florida</SelectItem>
                              <SelectItem value="TX">Texas</SelectItem>
                              <SelectItem value="LA">Louisiana</SelectItem>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="NY">New York</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="policyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="HO-3">HO-3 (Special Form)</SelectItem>
                              <SelectItem value="HO-6">HO-6 (Condo)</SelectItem>
                              <SelectItem value="DP-1">DP-1 (Dwelling Fire)</SelectItem>
                              <SelectItem value="DP-3">DP-3 (Dwelling Special)</SelectItem>
                              <SelectItem value="Commercial">Commercial Property</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="lossDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loss Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Wind damage to roof caused by Hurricane Milton on Oct 9, 2024. Water entered through torn shingles..." 
                            className="bg-background/50 resize-none h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full text-base font-semibold shadow-lg shadow-primary/25"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Policy via PDF Kitchen...
                      </>
                    ) : (
                      <>
                        Decode Policy <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
