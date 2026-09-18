/* Project catalogue for the portfolio site.
   Edit entries here; index.html renders from this array.
   `account` controls the GitHub URL, so repos from both accounts can coexist. */

const PROFILE = {
  name: "Di Feng",
  credentials: "MD, PhD",
  title: "Computational Biologist & AI/ML Lead",
  affiliation: "Senior Principal Scientist, Boehringer Ingelheim Pharmaceuticals",
  location: "Ridgefield, Connecticut",
  email: "di.feng.info@gmail.com",
  linkedin: "https://linkedin.com/in/di-feng",
  github: "https://github.com/d-feng",
  githubAlt: "https://github.com/BioXAGI",
  summary:
    "Computational biologist and AI/ML leader with 20+ years of cross-disciplinary " +
    "experience — 13 of them in the pharmaceutical industry — spanning drug discovery, " +
    "multi-omics, LLM and agent engineering, histopathology image analysis, and " +
    "translational oncology. My work sits where target discovery meets autonomous " +
    "research systems: building pipelines that take raw single-cell, spatial, and " +
    "perturbation data through to clinically interpretable hypotheses, and building " +
    "the agents that reason over them.",
  stats: [
    { value: "40", label: "Peer-reviewed publications" },
    { value: "1", label: "US patent" },
    { value: "20+", label: "Years in research" },
    { value: "13", label: "Years in pharma" }
  ]
};

const CATEGORIES = [
  { id: "targets", label: "Target Discovery & Immuno-Oncology" },
  { id: "agents", label: "Agentic AI for Research" },
  { id: "singlecell", label: "Single-Cell & Network Tooling" },
  { id: "data", label: "Data Acquisition & Pipelines" }
];

const PROJECTS = [
  {
    name: "antigen-combos",
    account: "BioXAGI",
    category: "targets",
    featured: true,
    lang: "Python",
    tagline: "Patient-aware discovery of combinatorial tumor-antigen gates",
    body:
      "Finds AND / OR / NOT Boolean antigen gates for cell therapies from single-cell data, " +
      "with patient-separated discovery and held-out testing rather than pooled-cell " +
      "evaluation. Reports malignant vs. normal epithelial coverage, patient prevalence, " +
      "and cell-cluster decoding, then validates independently in the ICBI colorectal " +
      "cancer atlas.",
    tags: ["single-cell", "CAR-T", "Boolean gates", "validation"]
  },
  {
    name: "Ecotypes",
    account: "d-feng",
    category: "targets",
    featured: true,
    lang: "R",
    tagline: "EcoTyper-based cell-state and ecotype discovery",
    body:
      "Machine-learning identification of cell-type-specific transcriptional states and " +
      "their co-association patterns from bulk and single-cell expression, extended with " +
      "prototype ecotype, STAD mutation, and gastric publication-aligned modules for " +
      "collaborator handoff.",
    tags: ["cell states", "bulk + scRNA", "tumor ecosystems"]
  },
  {
    name: "BioAgent",
    account: "BioXAGI",
    category: "agents",
    featured: true,
    lang: "Python",
    tagline: "Autonomous data-analysis agent for bioinformatics",
    body:
      "Give it a dataset and a research question: it profiles the data, plans the analysis, " +
      "writes and executes real Python, routes the statistics to a separate critic subagent " +
      "for review, and writes the report. Built on deepagents (LangChain / LangGraph) with " +
      "planning, an on-disk filesystem for reproducibility, and clean-context subagents.",
    tags: ["LangGraph", "deep agents", "critic subagent", "reproducible"]
  },
  {
    name: "co-scientist",
    account: "d-feng",
    category: "agents",
    featured: true,
    lang: "Python",
    tagline: "Agentic biomedical research platform",
    body:
      "Runs specialized AI workflows from CLI, Jupyter, or a desktop GUI with no R " +
      "dependency — a general Biomni biomedical agent, a GEO/SRA workflow with pyDESeq2 " +
      "and pathway enrichment, a spatial-transcriptomics agent for cell-type mapping and " +
      "cell–cell interaction, and the CellAtria single-cell agent.",
    tags: ["multi-workflow", "spatial", "GEO/SRA", "desktop GUI"]
  },
  {
    name: "deconv",
    account: "BioXAGI",
    category: "targets",
    featured: true,
    lang: "R",
    tagline: "De novo CD8 T-cell program discovery from bulk RNA-seq",
    body:
      "All-R immune deconvolution requiring neither Docker nor CIBERSORTx. Combines " +
      "quanTIseq CD8-fraction estimation, low-CD8 tumor filtering, residualization against " +
      "CD8 abundance, and consensus NMF across candidate ranks — with marker-coherence and " +
      "myeloid-contamination diagnostics built into the output.",
    tags: ["NMF", "quanTIseq", "bulk RNA-seq", "no Docker"]
  },
  {
    name: "Bio-llm-agent-evals",
    account: "d-feng",
    category: "agents",
    featured: true,
    lang: "Python",
    tagline: "Eval benchmarks for LLM agents in biomedical discovery",
    body:
      "Curated benchmarks and runnable scripts that test both raw multi-omics reasoning and " +
      "the ability to actually execute API calls and code — including a GeneTuring eval loop " +
      "driving live NCBI E-utilities tool calls via LangGraph.",
    tags: ["evals", "GeneTuring", "tool calls", "LangGraph"]
  },
  {
    name: "ECSearch",
    account: "BioXAGI",
    category: "targets",
    lang: "Python",
    tagline: "Two- and three-arm cancer target combination design",
    body:
      "Evaluates combination targets using bulk TPM eligibility, recovered-state and CE " +
      "associations, and optional sample-level single-cell CE co-occurrence. Deliberately " +
      "dependency-light: no R, Docker, or online services at runtime, with an offline wheel " +
      "bundle for air-gapped installs.",
    tags: ["combination targets", "offline install", "bulk TPM"]
  },
  {
    name: "search",
    account: "BioXAGI",
    category: "targets",
    lang: "Python",
    tagline: "immune-crispr — immune-phenotype gene search from CRISPR screens",
    body:
      "Answers how many genes carry an immune phenotype genome-wide from primary " +
      "CRISPR-screen data rather than annotation, using BioGRID-ORCS 2.0.18 as the curated " +
      "aggregation of published genome-wide screens. Handles the 753 MB archive download " +
      "with validate-and-retry against a server that drops chunked transfers.",
    tags: ["CRISPR screens", "BioGRID-ORCS", "genome-wide"]
  },
  {
    name: "BioNetwork",
    account: "d-feng",
    category: "singlecell",
    lang: "R",
    tagline: "Biologically anchored CRISPRi screen network visualisation",
    body:
      "Force-directed layouts position nodes by edge weight, not biology — they are dense, " +
      "irreproducible across runs, and unreadable at publication figure size. These R " +
      "pipelines integrate CRISPRi/CRISPRko screens into curated, biologically anchored " +
      "immune-pathway layouts instead.",
    tags: ["CRISPRi", "network layout", "publication figures"]
  },
  {
    name: "SingleCellExplorer",
    account: "d-feng",
    category: "singlecell",
    lang: "JavaScript",
    tagline: "Open-source web platform for single-cell analysis",
    body:
      "Published web application for interactive scRNA-seq exploration, released open-source " +
      "under GNU LGPLv3. Described in Feng et al., BMC Genomics 20 (2019).",
    tags: ["scRNA-seq", "web app", "LGPLv3", "published"],
    doi: "https://doi.org/10.1186/s12864-019-6053-y"
  },
  {
    name: "cellatria",
    account: "d-feng",
    category: "singlecell",
    lang: "Python",
    tagline: "Single-cell RNA-seq agent with GEO retrieval",
    body:
      "Containerized LangGraph agent for scRNA-seq workflows — dataset retrieval through " +
      "analysis — packaged with Docker for reproducible runs.",
    tags: ["LangGraph", "Docker", "scRNA-seq"]
  },
  {
    name: "Agent-connector",
    account: "d-feng",
    category: "agents",
    lang: "Jupyter Notebook",
    tagline: "Chaining and parallelizing Biomni bio-agents",
    body:
      "Lightweight framework for sequencing and parallelizing Biomni A1 bio-agents with " +
      "per-call execution tracking and Word report export. Built on Biomni, Claude, and " +
      "LangChain.",
    tags: ["Biomni", "orchestration", "execution tracking"]
  },
  {
    name: "biomni-launcher-ui",
    account: "d-feng",
    category: "agents",
    lang: "Python",
    tagline: "Desktop launcher for Biomni agentic workflows",
    body:
      "Tkinter desktop UI that runs Biomni biomedical workflows without a web server, with " +
      "project-scoped memory, semantic search over prior runs, and a result-review pass.",
    tags: ["desktop UI", "agent memory", "semantic search"]
  },
  {
    name: "Discovery-Stack",
    account: "BioXAGI",
    category: "agents",
    lang: "Python",
    tagline: "Modular AI infrastructure layer for scientific discovery",
    body:
      "A composable substrate for discovery workflows — the shared infrastructure the " +
      "agent and analysis projects above build against.",
    tags: ["infrastructure", "modular"]
  },
  {
    name: "cbioportal_run",
    account: "BioXAGI",
    category: "data",
    lang: "Python",
    tagline: "GEO series downloader and cBioPortal plotting workflow",
    body:
      "Workflow-oriented acquisition for GEO series — supplementary archive retrieval, run " +
      "manifests, human-readable summaries, H5AD conversion, and an emittable Mermaid " +
      "workflow graph — paired with a cBioPortal plotting pipeline.",
    tags: ["GEO", "H5AD", "cBioPortal", "manifests"]
  },
  {
    name: "IMvigor210_TGFb",
    account: "d-feng",
    category: "data",
    lang: "R",
    tagline: "TGF-β immunotherapy response analysis",
    body:
      "Computational analysis of the IMvigor210 atezolizumab cohort, focused on TGF-β " +
      "signalling and its relationship to checkpoint-blockade response.",
    tags: ["immunotherapy", "IMvigor210", "TGF-β"]
  },
  {
    name: "LangGraph-cookbook",
    account: "d-feng",
    category: "agents",
    lang: "Jupyter Notebook",
    tagline: "Practical LangGraph + Claude agent recipes",
    body:
      "Working recipes from web-search chatbots and stock screeners through to gene " +
      "enrichment analysis — the reference notebooks behind the production agents.",
    tags: ["LangGraph", "Claude", "recipes"]
  },
  {
    name: "scData_agent",
    account: "BioXAGI",
    category: "data",
    lang: "Python",
    tagline: "Workflow-oriented GEO single-cell downloader",
    body:
      "Resolves a GEO accession to its processed supplementary archive, records run metadata " +
      "in a manifest, writes a human-readable summary, and converts to H5AD for downstream " +
      "scverse tooling.",
    tags: ["GEO", "H5AD", "reproducible download"]
  }
];

const SKILLS = [
  {
    heading: "AI & Agent Engineering",
    items: ["LLM agent architecture", "LangChain", "LangGraph", "Agent evals & benchmarks",
            "Tool-call orchestration", "RAG (FAISS, embeddings)", "PyTorch", "Transformers"]
  },
  {
    heading: "Single-Cell & Spatial",
    items: ["Cell Ranger / Space Ranger", "Seurat", "Scanpy", "scVI / scANVI / totalVI",
            "Harmony", "Monocle", "Visium, GeoMx, CosMx", "scverse / OmicVerse"]
  },
  {
    heading: "Genomics & NGS",
    items: ["RNA-seq", "ATAC-seq", "CITE-seq", "ChIP-seq", "GATK / Mutect2",
            "GWAS & TWAS", "Mendelian randomization", "GSEA"]
  },
  {
    heading: "Imaging & Computer Vision",
    items: ["Histopathology analytics", "Segmentation & detection (CNNs)",
            "Spatial image biomarkers", "Multi-modal genomics + imaging", "OpenCV",
            "scikit-image"]
  },
  {
    heading: "Languages & Infrastructure",
    items: ["Python", "R / Bioconductor / Shiny", "Bash", "JavaScript", "AWS",
            "Databricks", "HPC (SLURM/PBS)", "Nextflow"]
  }
];

const PUBLICATIONS = [
  { text: "Single Cell Explorer: a web server for interactive single-cell RNA-seq analysis.",
    venue: "BMC Genomics 20", year: "2019", authors: "Di Feng et al.",
    doi: "https://doi.org/10.1186/s12864-019-6053-y" },
  { text: "Perturbation of calreticulin potentiates CD8+ T cell antitumor immunity.",
    venue: "Journal of Experimental Medicine", year: "2025", authors: "Kaiyang Tang et al.",
    doi: "https://doi.org/10.1084/jem.20242360" },
  { text: "TCPGdb: a CRISPR screen database of T cell perturbation genomics.",
    venue: "Cancer Immunology Research", year: "2025", authors: "Chuanpeng Dong et al.",
    doi: "https://doi.org/10.1158/2326-6066.CIR-25-0168" },
  { text: "Sensitive detection of synthetic response to cancer immunotherapy via gene paralog pairs.",
    venue: "Patterns", year: "2025", authors: "Chuanpeng Dong et al.",
    doi: "https://doi.org/10.1016/j.patter.2025.101184" },
  { text: "Reshaping the KRAS-G12D PDAC tumor microenvironment with SOS1 + MEK inhibition.",
    venue: "Cancer Research Communications", year: "2024", authors: "Robert J. Norgard et al.",
    doi: "https://doi.org/10.1158/2767-9764.crc-24-0172" },
  { text: "Deep learning for discovering the pathological continuum of crypts.",
    venue: "PLoS ONE", year: "2021", authors: "Dechao Shan et al.",
    doi: "https://doi.org/10.1371/journal.pone.0252429" },
  { text: "Genetic variants and disease-associated factors contribute to enhanced IRF5 expression in SLE.",
    venue: "Arthritis & Rheumatism", year: "2010", authors: "Di Feng et al.",
    doi: "https://doi.org/10.1002/art.27223" },
  { text: "Method and system for automated autoantibody detection and identification.",
    venue: "US Patent App. 13/592,492", year: "2013", authors: "Betsy J. Barnes, Di Feng et al.",
    doi: null }
];
