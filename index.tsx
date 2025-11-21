
import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import {
  Sparkles, Upload, Zap, Image as ImageIcon, Video, 
  ChevronDown, HelpCircle, Check, X, Menu, Globe,
  Layout, Lock, Wand2, Layers, MousePointer2, Download, Loader2, Type,
  ArrowRight, Search, Play, Settings, Trash2, ExternalLink, Info
} from "lucide-react";

// ==========================================
// 1. Types & Utility
// ==========================================

type ViewState = 'landing' | 'app';
type EditorMode = 'edit' | 'generate';
type ModelType = 'nano-banana' | 'nano-banana-pro';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const MODELS = {
  basic: 'gemini-2.5-flash-image',
  pro: 'gemini-3-pro-image-preview'
};

// ==========================================
// 2. Gemini API Integration
// ==========================================

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generateImage(
  prompt: string, 
  modelType: ModelType, 
  sourceImage: string | null,
  mode: EditorMode
): Promise<string> {
  const modelName = modelType === 'nano-banana-pro' ? MODELS.pro : MODELS.basic;

  try {
    let response;
    
    if (mode === 'edit' && sourceImage) {
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(';')[0].split(':')[1];

      response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: prompt }
          ]
        }
      });
    } else {
      // Text to Image
      response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }]
        }
      });
    }

    if (response && response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated. The model might have returned text only.");
  } catch (e) {
    console.error("Generation failed", e);
    throw e;
  }
}

// ==========================================
// 3. UI Components (Shadcn Style)
// ==========================================

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

const Separator = ({ className }: { className?: string }) => (
    <div className={cn("shrink-0 bg-border h-[1px] w-full", className)} />
);

const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" }) => {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border-border",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props} />
  );
};

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

const AccordionItem = ({ title, children, isOpen, onClick }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => (
  <div className="border-b">
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full text-left text-sm"
    >
      {title}
      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
    </button>
    <div className={cn("overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down", isOpen ? "block mb-4 text-muted-foreground" : "hidden")}>
      {children}
    </div>
  </div>
);

// ==========================================
// 4. Feature Components
// ==========================================

const Navbar = ({ currentView, setView }: { currentView: ViewState, setView: (v: ViewState) => void }) => (
  <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 items-center">
      <div className="mr-4 hidden md:flex">
        <a className="mr-6 flex items-center space-x-2 cursor-pointer" onClick={() => setView('landing')}>
          <span className="font-bold sm:inline-block flex items-center gap-2">
             <span className="bg-primary text-primary-foreground rounded-md w-6 h-6 flex items-center justify-center text-xs">N</span>
             Nano Banana
          </span>
        </a>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <button onClick={() => setView('app')} className={cn("transition-colors hover:text-foreground/80", currentView === 'app' ? "text-foreground" : "text-foreground/60")}>Editor</button>
          <button className="transition-colors hover:text-foreground/80 text-foreground/60">Showcase</button>
          <button className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</button>
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <div className="w-full flex-1 md:w-auto md:flex-none"></div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
           </Button>
           <Button variant="outline" size="sm" onClick={() => setView('app')} className="hidden md:flex h-8">
              Sign In
           </Button>
           <Button variant="default" size="sm" onClick={() => setView('app')} className="h-8">
              Try Pro
           </Button>
        </div>
      </div>
    </div>
  </nav>
);

const LandingPage = ({ setView }: { setView: (v: ViewState) => void }) => {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                {/* Hero Section */}
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <a className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted/80" href="#">
                            📣 Introducing Nano Banana 2.0
                        </a>
                        <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter">
                            AI Image Editing <br className="hidden sm:inline" />
                            Reimagined for <span className="text-primary">Creators</span>
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Nano Banana brings professional-grade generative AI directly to your browser. Edit, generate, and transform images with simple text commands.
                        </p>
                        <div className="space-x-4">
                            <Button size="lg" onClick={() => setView('app')} className="px-8">
                                Get Started
                            </Button>
                            <Button variant="outline" size="lg" className="px-8">
                                View Gallery
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
                    <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                        <Card className="flex flex-col justify-between overflow-hidden border-muted bg-card/50 p-6">
                            <Wand2 className="h-12 w-12 text-primary mb-4" />
                            <div className="space-y-2">
                                <h3 className="font-bold">Smart Edit</h3>
                                <p className="text-sm text-muted-foreground">Modify existing images with natural language instructions.</p>
                            </div>
                        </Card>
                        <Card className="flex flex-col justify-between overflow-hidden border-muted bg-card/50 p-6">
                            <Sparkles className="h-12 w-12 text-primary mb-4" />
                            <div className="space-y-2">
                                <h3 className="font-bold">Generative Fill</h3>
                                <p className="text-sm text-muted-foreground">Expand images or fill in missing details automatically.</p>
                            </div>
                        </Card>
                        <Card className="flex flex-col justify-between overflow-hidden border-muted bg-card/50 p-6">
                            <Layers className="h-12 w-12 text-primary mb-4" />
                            <div className="space-y-2">
                                <h3 className="font-bold">Style Transfer</h3>
                                <p className="text-sm text-muted-foreground">Apply consistent artistic styles across your project.</p>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="container py-8 md:py-12 lg:py-24 max-w-3xl">
                     <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Frequently Asked Questions</h2>
                        <p className="mt-4 text-muted-foreground">Everything you need to know about Nano Banana.</p>
                     </div>
                     <div className="grid gap-2">
                        {['How does the credit system work?', 'Can I use images for commercial purposes?', 'What models are supported?'].map((q, i) => (
                            <AccordionItem 
                                key={i} 
                                title={q} 
                                isOpen={faqOpen === i} 
                                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                            >
                                Nano Banana leverages the Gemini 2.5 Flash and 3.0 Pro models to deliver state-of-the-art image generation. Commercial usage rights are included with the Pro plan.
                            </AccordionItem>
                        ))}
                     </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built by <span className="font-medium underline underline-offset-4">Nano Banana Inc</span>.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const EditorSidebar = ({ 
    mode, setMode, model, setModel, prompt, setPrompt, 
    uploadedImage, onUpload, isLoading, onGenerate, credits 
}: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="w-full lg:w-[340px] xl:w-[380px] flex flex-col gap-6 p-6 border-r bg-card h-full overflow-y-auto">
            
            {/* Mode Switcher */}
            <div className="grid w-full grid-cols-2 p-1 bg-muted rounded-lg">
                <button
                    onClick={() => setMode('edit')}
                    className={cn("text-sm font-medium py-1.5 rounded-md transition-all", mode === 'edit' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                    Edit Image
                </button>
                <button
                    onClick={() => setMode('generate')}
                    className={cn("text-sm font-medium py-1.5 rounded-md transition-all", mode === 'generate' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                    Text to Image
                </button>
            </div>

            <Separator />

            {/* Model Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Model</Label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">V 2.5</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <div 
                        onClick={() => setModel('nano-banana')}
                        className={cn("cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 relative", model === 'nano-banana' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input")}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">Nano Banana Flash</span>
                            <Zap className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground">Fast, efficient, reliable.</p>
                    </div>
                    <div 
                        onClick={() => setModel('nano-banana-pro')}
                        className={cn("cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 relative", model === 'nano-banana-pro' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input")}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">Nano Banana Pro</span>
                            <Badge variant="default" className="h-4 px-1 text-[9px]">NEW</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">High definition, complex reasoning.</p>
                    </div>
                </div>
            </div>

            {/* Upload Section (Conditional) */}
            {mode === 'edit' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label>Reference Image</Label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative flex flex-col items-center justify-center w-full h-40 rounded-lg border border-dashed border-muted-foreground/25 hover:bg-accent/50 transition-all cursor-pointer overflow-hidden"
                    >
                        {uploadedImage ? (
                            <>
                                <img src={uploadedImage} alt="Reference" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium shadow-sm">Replace Image</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                                <Upload className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-xs font-medium">Click or drag to upload</p>
                                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={(e) => onUpload(e.target.files?.[0])} 
                            className="hidden" 
                            accept="image/*" 
                        />
                    </div>
                </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label>Prompt</Label>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary" onClick={() => setPrompt(mode === 'edit' ? "Make it cyberpunk style" : "A futuristic city with neon lights")}>
                        Surprise Me
                    </Button>
                </div>
                <Textarea 
                    placeholder={mode === 'edit' ? "Describe how you want to change the image..." : "Describe the image you want to generate..."}
                    className="min-h-[120px] resize-none text-sm"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">{prompt.length} / 2000</p>
            </div>

            {/* Action Area */}
            <div className="mt-auto pt-6 space-y-4">
                 <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded-md border border-border/50">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span>System Operational</span>
                    </div>
                    <span>{credits} Credits Avail.</span>
                 </div>
                 <Button 
                    className="w-full font-semibold h-11 text-base" 
                    onClick={onGenerate}
                    disabled={isLoading || !prompt || (mode === 'edit' && !uploadedImage)}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

const AppEditor = () => {
    const [mode, setMode] = useState<EditorMode>('edit');
    const [model, setModel] = useState<ModelType>('nano-banana');
    const [prompt, setPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [credits, setCredits] = useState(250);

    const handleUpload = (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setUploadedImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await generateImage(prompt, model, uploadedImage, mode);
            setResultImage(result);
            setCredits(c => c - (model === 'nano-banana-pro' ? 10 : 2));
        } catch (e) {
            alert("Failed to generate. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
            <EditorSidebar 
                mode={mode} setMode={setMode}
                model={model} setModel={setModel}
                prompt={prompt} setPrompt={setPrompt}
                uploadedImage={uploadedImage} onUpload={handleUpload}
                isLoading={isLoading} onGenerate={handleGenerate}
                credits={credits}
            />
            
            {/* Main Canvas Area */}
            <main className="flex-1 relative bg-muted/10 flex flex-col">
                {/* Toolbar */}
                <div className="h-12 border-b bg-background flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{mode === 'edit' ? 'Edit Mode' : 'Generation Mode'}</span>
                        <span className="text-muted-foreground/50">/</span>
                        <span>{model === 'nano-banana' ? 'Flash' : 'Pro'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {resultImage && (
                            <a href={resultImage} download={`nano-banana-${Date.now()}.png`}>
                                <Button variant="outline" size="sm" className="h-8">
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    Download
                                </Button>
                            </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Info className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 relative p-8 overflow-auto flex items-center justify-center">
                    {/* Background Grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                        style={{
                            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {!resultImage && !isLoading ? (
                        <div className="text-center max-w-md space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="h-24 w-24 bg-muted rounded-2xl mx-auto flex items-center justify-center mb-6 border border-border shadow-sm">
                                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold">Ready to Create</h3>
                            <p className="text-sm text-muted-foreground">
                                Configure your generation settings in the sidebar and click Generate to see the magic happen.
                            </p>
                            <div className="flex justify-center gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    setMode('edit');
                                    setUploadedImage('https://picsum.photos/id/64/800/800');
                                    setPrompt('Turn this into a watercolor painting');
                                }}>
                                    Try Example
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative max-w-4xl w-full aspect-square md:aspect-video flex items-center justify-center rounded-lg border bg-card shadow-xl overflow-hidden">
                            {isLoading ? (
                                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse"></div>
                                        <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
                                    </div>
                                    <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Generating assets...</p>
                                </div>
                            ) : null}
                            
                            {resultImage && (
                                <img 
                                    src={resultImage} 
                                    alt="Generated Result" 
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const App = () => {
  const [currentView, setView] = useState<ViewState>('landing');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Navbar currentView={currentView} setView={setView} />
      {currentView === 'landing' ? (
        <LandingPage setView={setView} />
      ) : (
        <AppEditor />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
