import os
import json
import random
from datetime import datetime, timedelta

# Sample data for document generation
SAMPLE_TITLES = [
    "The Future of Artificial Intelligence",
    "Climate Change: A Global Crisis",
    "Modern Web Development Techniques",
    "The Art of Storytelling",
    "Quantum Computing Explained",
    "A Review of the Latest Smartphone",
    "Healthy Eating Habits for Busy Professionals",
    "The History of Space Exploration",
    "Understanding Blockchain Technology",
    "The Psychology of Decision Making",
    "Sustainable Energy Solutions",
    "The Impact of Social Media on Society",
    "Machine Learning for Beginners",
    "The Evolution of Cinema",
    "Effective Time Management Strategies",
    "The Science of Sleep",
    "Modern Poetry Analysis",
    "Economic Trends in the Post-Pandemic World"
]

SAMPLE_AUTHORS = [
    "John Smith",
    "Emily Johnson",
    "Michael Chen",
    "Sarah Williams",
    "David Rodriguez",
    "Olivia Kim",
    "James Wilson",
    "Sophia Garcia",
    "Robert Taylor",
    "Emma Martinez"
]

SAMPLE_CATEGORIES = [
    "Technology",
    "Science",
    "Health",
    "Business",
    "Arts",
    "Education",
    "Environment",
    "Politics",
    "Entertainment",
    "Sports"
]

# Sample content snippets with different sentiment types
POSITIVE_CONTENT = [
    """The advancements in technology have brought tremendous benefits to society. Innovations in healthcare have saved countless lives, while improvements in communication have connected people across the globe. The future looks incredibly promising as researchers continue to develop solutions to our most pressing challenges. With collaborative efforts and positive mindsets, we can harness these technologies to create a better world for everyone.

Recent breakthroughs in renewable energy are particularly exciting. Solar and wind power have become more efficient and affordable, making clean energy accessible to more communities. This progress gives us hope for a sustainable future where we can meet our energy needs without harming the environment. The dedication of scientists and engineers working in this field is truly inspiring.

Education has also been transformed by technology. Students now have access to resources and learning opportunities that were unimaginable just a few decades ago. Online courses, interactive simulations, and global classrooms have democratized knowledge and empowered learners of all ages. The joy of discovery and the thrill of mastering new skills are now available to anyone with an internet connection.

Perhaps most heartening is the way technology has enabled people to come together for positive change. Social media platforms, despite their challenges, have allowed communities to organize, raise awareness about important issues, and support those in need. Crowdfunding campaigns have funded medical treatments, disaster relief, and innovative startups. These connections remind us of our shared humanity and our capacity for compassion.

As we look to the future, there are countless reasons to be optimistic. The pace of innovation continues to accelerate, and each breakthrough builds upon previous successes. With thoughtful implementation and ethical considerations, technology can help us create a world that is more just, sustainable, and fulfilling for all people.""",
    
    """The exhibition exceeded all expectations, showcasing a brilliant collection of contemporary art that challenges and inspires. Each piece demonstrated exceptional craftsmanship and profound conceptual depth. The curator's thoughtful arrangement created a journey through diverse perspectives and emotions, leaving visitors with a renewed appreciation for artistic expression.

Particularly impressive was the integration of interactive elements that invited audience participation. This innovative approach transformed passive viewing into an engaging experience that resonated on multiple levels. The artists' willingness to explore new techniques and materials demonstrated a fearless commitment to pushing boundaries and expanding possibilities.

The venue itself enhanced the exhibition with its perfect lighting and spacious layout. Staff members were knowledgeable and enthusiastic, eager to provide context and answer questions. Their passion for the artwork was evident and contagious, enriching the overall experience.

This exhibition represents a significant contribution to the cultural landscape of our city. It brings fresh voices and visions to the forefront, celebrating creativity and fostering meaningful dialogue. Events like this remind us of art's power to unite, challenge, and inspire us toward greater understanding and appreciation of our shared humanity.

I wholeheartedly recommend visiting this extraordinary collection before it concludes its run. The experience will leave you energized, thoughtful, and eager to explore more of what the contemporary art world has to offer.""",
    
    """The new community garden project has transformed an abandoned lot into a vibrant green space that brings neighbors together. Volunteers of all ages have contributed their time and energy, planting vegetables, flowers, and native species that attract pollinators. The garden has become a source of fresh produce for local families and a beautiful gathering place for community events.

Children have especially benefited from the garden, learning about plant life cycles, sustainable agriculture, and the importance of environmental stewardship. Their excitement when harvesting vegetables they've grown themselves is contagious and heartwarming. Many schools now organize field trips to the garden, incorporating it into their science curriculum.

The project has also fostered stronger connections among residents who previously had little interaction. Working side by side, people have shared gardening tips, recipes, and stories, breaking down barriers and building friendships. Monthly potluck dinners featuring garden-grown ingredients have become popular social events that celebrate the community's diversity and shared accomplishments.

Beyond its social benefits, the garden has improved the neighborhood's environmental health. The plants absorb carbon dioxide, reduce urban heat, and provide habitat for beneficial insects and birds. Rainwater collection systems and composting demonstrate sustainable practices that many participants have adopted in their own homes.

What began as a simple beautification effort has blossomed into something far more significant—a testament to what communities can achieve when they come together with shared purpose and optimism."""
]

NEGATIVE_CONTENT = [
    """The implementation of the new policy has been a complete disaster from start to finish. Despite numerous warnings from experts, administrators pushed forward with a flawed plan that has created more problems than it solved. Resources have been wasted, morale has plummeted, and the intended beneficiaries have been left worse off than before.

Poorly designed systems and inadequate training have resulted in widespread confusion and frustration. Staff members struggle daily with cumbersome procedures that hinder rather than help their work. Many have expressed concerns about sustainability and effectiveness, only to be ignored or dismissed by decision-makers who seem detached from operational realities.

The financial implications are equally troubling. Costs have far exceeded initial projections, with no corresponding benefits to justify the expenditure. Budget allocations for essential services have been diverted to support this failing initiative, creating shortfalls in critical areas. Taxpayers and stakeholders deserve better stewardship of limited resources.

Perhaps most concerning is the lack of accountability from leadership. Rather than acknowledging problems and making necessary adjustments, there has been a pattern of denying issues and blaming external factors. This refusal to engage with legitimate criticism has eroded trust and prevented meaningful improvements.

Unless there is a significant change in approach, including honest assessment and willingness to change course, this policy will continue to fail those it purports to serve while draining valuable resources that could be better utilized elsewhere.""",
    
    """The restaurant experience was thoroughly disappointing from the moment we arrived. Despite having a reservation, we waited over 30 minutes to be seated while watching walk-in customers get tables before us. The host was unapologetic and seemed annoyed by our inquiries about the delay.

Once seated, service problems continued. Our server was inattentive and difficult to locate when needed. Drink orders were incorrect, and it took multiple requests to receive water refills. The lengthy gaps between courses suggested serious kitchen management issues that affected the entire dining experience.

The food quality failed to justify either the wait or the premium prices. My entree arrived lukewarm, indicating it had been sitting out before delivery. The presentation was sloppy, with sauce splattered around the plate edges. Flavors were unbalanced—either bland or overpoweringly salty—suggesting a lack of care in preparation and quality control.

The dining room itself was uncomfortably loud, with acoustics that amplified every conversation and kitchen noise. Tables were positioned too closely together, eliminating any sense of privacy or comfortable dining space. The overall cleanliness was questionable, with visible food debris on supposedly clean utensils.

Given the restaurant's reputation and price point, this experience fell far below reasonable expectations. I cannot recommend this establishment and will not be returning.""",
    
    """The software update has created numerous critical problems that have severely impacted productivity across our organization. Basic functions that previously worked seamlessly now fail unpredictably, forcing employees to develop time-consuming workarounds. The new interface is counterintuitive and requires significantly more clicks to accomplish routine tasks.

System performance has degraded noticeably, with frequent freezes and slow response times even on high-specification machines. Several team members have reported complete crashes that resulted in data loss despite autosave features supposedly being enabled. These technical issues have extended average task completion times by approximately 40%.

Customer-facing operations have been particularly affected. The client portal contains multiple broken links and display errors that project an unprofessional image. Support staff are overwhelmed with complaints they cannot adequately address due to the software's persistent problems. This situation is damaging client relationships that took years to build.

Despite numerous detailed bug reports submitted through official channels, the development team has been unresponsive. The few updates provided have been vague and failed to offer concrete timelines for resolving critical issues. This communication breakdown has added frustration to an already difficult situation.

The decision to roll out this update without adequate testing has proven costly in both tangible and intangible ways. Management must take immediate action to either resolve these issues or revert to the previous stable version before further damage occurs."""
]

NEUTRAL_CONTENT = [
    """The annual report provides a comprehensive overview of the organization's activities during the fiscal year 2022-2023. Total revenue reached $4.2 million, representing a 2.3% increase from the previous year. Operating expenses totaled $3.8 million, allocated across program services (65%), administrative costs (20%), and fundraising efforts (15%).

Membership numbers remained relatively stable with a slight decrease of 1.7% compared to last year. The average member retention rate was 76%, which aligns with industry standards. New member acquisition campaigns yielded 342 new registrations, primarily through digital marketing channels and referral programs.

The organization completed 24 projects across its three main program areas. Project completion rates met targets in two areas but fell short by approximately 15% in the third due to staffing transitions during Q2. Client satisfaction surveys indicated consistent service quality with an average rating of 4.1 out of 5, unchanged from previous measurements.

Staff turnover increased to 18% from last year's 12%, with exit interviews citing competitive salary offers and career advancement opportunities as primary factors. In response, the HR department has initiated a compensation review and expanded professional development programs for current employees.

Looking ahead, the strategic plan identifies four priority areas for the coming fiscal year: technological infrastructure upgrades, program expansion in underserved regions, diversification of funding sources, and enhanced volunteer engagement initiatives.""",
    
    """The city council meeting on March 15 addressed several agenda items related to municipal development and public services. The session began at 7:00 PM with all nine council members present and approximately 45 citizens in attendance.

The first item concerned the proposed rezoning of the North District to accommodate mixed-use development. City planners presented analysis indicating potential economic benefits alongside increased infrastructure demands. Public comments included concerns about traffic congestion and support for expanded housing options. The council voted to continue the discussion at next month's meeting pending additional traffic impact studies.

Next, the public works director provided updates on the water main replacement project. Phase one has been completed on schedule and within budget. Phase two will commence in April and affect residents on Elm, Oak, and Pine Streets. Notifications will be distributed to affected households two weeks before construction begins.

The parks department presented three options for renovating Central Park playground equipment. Cost estimates ranged from $125,000 to $280,000 depending on materials and accessibility features. The council approved the formation of a citizen advisory committee to review options and provide recommendations by June.

The meeting concluded with routine approval of minutes from the previous session and scheduling of a special workshop on municipal broadband possibilities. Adjournment occurred at 9:45 PM with the next regular meeting set for April 12.""",
    
    """The research study examined correlations between sleep patterns and cognitive performance among university students. Participants (n=128) completed daily sleep logs and performed standardized cognitive assessments over a four-week period during the academic semester.

Methodology involved wrist-worn actigraphy devices to objectively measure sleep duration and quality. Cognitive assessments included tests of working memory, attention span, and problem-solving ability administered through a validated digital platform. Demographic variables and academic course load were recorded as potential confounding factors.

Results indicated that sleep duration averaged 6.4 hours per night (SD=1.2) across the sample population. Significant correlations were observed between sleep consistency (regular sleep/wake times) and performance on working memory tasks (r=0.42, p<0.01). Sleep duration below six hours was associated with a 15% decrease in attention span measures compared to sleep durations exceeding seven hours.

Interestingly, weekend recovery sleep (extending sleep duration on non-class days) showed limited effectiveness in compensating for weekday sleep restriction. Gender differences were not statistically significant for any measured parameters after controlling for course type and academic major.

Limitations include the observational nature of the study and potential seasonal effects, as data collection occurred during a single academic term. Future research directions could include interventional approaches to sleep schedule regulation and longitudinal assessment across multiple semesters."""
]

TECHNICAL_CONTENT = [
    """The implementation of a distributed database system requires careful consideration of several key architectural components. Sharding strategies must balance data distribution for optimal query performance while maintaining referential integrity across nodes. Horizontal sharding partitions data rows across multiple servers based on a partition key, while vertical sharding distributes different tables or columns to separate database instances.

Consistency models present another critical decision point. Strong consistency guarantees that all nodes see the same data at the same time but typically reduces availability during network partitions. Eventual consistency prioritizes availability but accepts temporary inconsistencies that resolve over time. The CAP theorem establishes that distributed systems cannot simultaneously provide consistency, availability, and partition tolerance—system designers must prioritize two of these properties based on application requirements.

Replication mechanisms support both performance and fault tolerance objectives. Master-slave replication directs all write operations to a primary node that propagates changes to replica nodes, while multi-master configurations allow writes to any node with subsequent synchronization. Conflict resolution strategies become essential in multi-master architectures, with options including timestamp-based resolution, version vectors, and application-specific merge functions.

Query optimization in distributed environments differs significantly from single-node databases. Execution plans must account for data locality, network latency, and join operations across partitions. Cost-based optimizers require enhanced metadata about partition distribution and network topology to generate efficient query paths.

Monitoring distributed databases introduces additional complexity. Beyond traditional metrics like CPU and memory utilization, effective observability requires tracking replication lag, partition balance, and cross-node transaction performance. Time-series analysis of these metrics helps identify emerging issues before they impact application performance.""",
    
    """The quantum circuit model provides a framework for expressing quantum algorithms through a sequence of quantum gates applied to qubit registers. Unlike classical logic gates, quantum gates are represented by unitary matrices that preserve the normalization of quantum states. The Hadamard gate (H), phase gate (S), and controlled-NOT (CNOT) form a universal gate set capable of approximating any quantum operation when combined with arbitrary single-qubit rotations.

Quantum circuit depth and width represent critical resource constraints. Circuit depth corresponds to execution time and increases vulnerability to decoherence, while width indicates the number of qubits required. Optimization techniques include gate cancellation, commutation analysis, and teleportation-based gate compression to reduce these resource requirements without altering algorithm functionality.

Transpilation converts abstract quantum circuits to hardware-specific implementations by mapping logical qubits to physical qubits, replacing gates with hardware-native operations, and routing operations to respect device connectivity constraints. This process must account for error rates of specific physical qubits and connections, often requiring heuristic approaches to balance competing optimization objectives.

Simulation of quantum circuits on classical hardware becomes exponentially more demanding as qubit count increases. Tensor network methods offer more efficient simulation for certain circuit classes by exploiting entanglement structure. Full state vector simulation requires memory scaling as O(2^n) for n qubits, while stabilizer circuits can be simulated in polynomial time using the Gottesman-Knill theorem.

Noise modeling incorporates depolarizing channels, amplitude damping, and phase damping to represent realistic quantum hardware behavior. Error mitigation techniques include zero-noise extrapolation, probabilistic error cancellation, and symmetry verification to improve algorithm performance on noisy intermediate-scale quantum (NISQ) devices.""",
    
    """The TCP congestion control algorithm manages network traffic to prevent collapse while maximizing throughput. The core mechanism employs a congestion window (cwnd) that limits the number of unacknowledged packets in transit. This window size adjusts dynamically based on network conditions detected through packet acknowledgment patterns and timeout events.

The slow start phase initializes cwnd to a small value (typically 1-10 maximum segment sizes) and doubles it with each round-trip time until reaching the slow start threshold or detecting packet loss. This exponential growth quickly probes available bandwidth while minimizing initial network impact. Upon threshold crossing or congestion detection, the algorithm transitions to congestion avoidance.

During congestion avoidance, cwnd increases linearly (approximately by 1/cwnd per acknowledgment) to cautiously approach maximum capacity. This additive increase continues until packet loss occurs, signaling network saturation. Loss detection happens through duplicate acknowledgments (fast retransmit) or transmission timeouts.

Fast recovery allows the connection to maintain higher throughput after isolated packet losses. Upon receiving three duplicate acknowledgments, TCP retransmits the missing segment without waiting for a timeout, then reduces cwnd by half and enters congestion avoidance. This approach avoids the costly slow start phase when network capacity remains available despite occasional losses.

Modern TCP variants implement refinements to this basic framework. TCP CUBIC modifies the window growth function to improve utilization on high-bandwidth, high-latency networks. BBR (Bottleneck Bandwidth and Round-trip time) takes a model-based approach that explicitly estimates available bandwidth and propagation delay rather than inferring congestion solely from packet loss."""
]

CREATIVE_CONTENT = [
    """The old lighthouse stood sentinel on the rocky promontory, its weathered stone facade bearing witness to a century of storms and sunsets. Marina traced her fingers along the spiral staircase as she climbed, feeling the worn grooves left by generations of keepers before her. The inheritance of this lonely outpost had come unexpectedly—a bequest from a great-aunt she'd met only twice, along with a cryptic letter mentioning "responsibilities beyond the light."

As she reached the lantern room, golden afternoon light streamed through the Fresnel lens, casting prismatic patterns across the curved walls. The mechanical clockwork that rotated the light needed winding, its brass gears gleaming with recent care despite her aunt's passing three weeks prior. Marina frowned. Someone had been maintaining the lighthouse.

A movement on the horizon caught her eye—a small fishing boat navigating dangerously close to the submerged rocks that made this coastline a maritime graveyard. Without thinking, Marina found herself reaching for the signal horn, giving three long blasts that echoed across the water. The boat adjusted course immediately, as if the helmsman had been waiting for her guidance.

Later that evening, as darkness enveloped the peninsula, Marina discovered a leather-bound journal hidden in a compartment beneath the supply cabinet. Its pages contained not just maintenance logs but detailed accounts of visitors that arrived not by sea or land, but through what her aunt described as "the thin places"—moments when the lighthouse served as more than a beacon for conventional travelers.

As she read by lamplight, the first fog of the season rolled in, and the lighthouse lens began to rotate on its own, though the clockwork remained unwound. A soft knocking came from the door at the base of the tower, three measured taps that resonated up the stone stairwell. Marina closed the journal, understanding now what her aunt had meant about responsibilities. She descended to answer the door, unsure what manner of traveler sought refuge but certain of her duty to guide them safely home.""",
    
    """Professor Eliza Chen adjusted her augmented reality glasses as the quantum harmonizer hummed to life, its holographic display projecting a three-dimensional model of the multiverse structure she'd spent fifteen years mapping. Today's experiment would either validate her life's work or expose a fundamental flaw in her understanding of interdimensional mechanics.

"Power levels nominal," reported Sanjay, her graduate assistant, fingers dancing across the haptic interface. "Boundary conditions stable. We're ready when you are."

Eliza nodded, suppressing the flutter of anxiety in her chest. The university had threatened to pull funding after her last three attempts failed to produce measurable results. What her colleagues didn't understand—couldn't understand—was that failure in this field didn't mean the theory was wrong. It meant they were successfully proving the existence of divergent causal pathways.

"Initiating quantum observer protocol," she announced, activating the device with her neural implant. The laboratory lights dimmed as power redirected to the harmonizer. "Targeting dimensional coordinates Alpha-7-Echo-3."

The air in the center of the containment field shimmered, molecules vibrating at frequencies beyond normal perception. A perfect sphere of distortion formed, its surface rippling like oil on water. Inside, shadows moved—almost human in shape but with proportions subtly wrong, as if viewed through an imperfect lens.

"We've got resonance!" Sanjay exclaimed, excitement overriding scientific detachment. "Quantum signature matches theoretical predictions within 0.03 percent!"

Eliza stepped closer to the sphere, her reflection fragmenting into countless versions of herself. One raised a hand in what might have been greeting. Another turned away. A third seemed to be writing something—numbers or symbols impossible to decipher.

"Begin recording protocol," she said softly. "We're not just observing the multiverse. It's observing us back."

As if in response, the sphere pulsed once, and every electronic device in the laboratory displayed the same unexpected message: "Coordinate lock established. Visitor exchange authorized."

Eliza hadn't programmed that protocol. No one had.""",
    
    """The recipe had been in Abuela's family for generations, passed down without ever being written on paper. Maya watched her grandmother's hands work from memory—measuring spices in palmfuls rather than teaspoons, adding ingredients in a sequence dictated by feeling rather than formula. Today was Maya's turn to learn, her inheritance taking shape in a copper pot that had darkened with age and use.

"The secret," Abuela said, stirring the simmering mixture, "is not in what you add, but when you add it. The chiles go in only after the moon rises."

Maya glanced out the kitchen window at the afternoon sun. "But that's hours from now."

Abuela smiled, the wrinkles around her eyes deepening. "Exactly. Patience is the ingredient most cooks forget."

As they waited, Abuela told stories—how the sauce had once cured her great-grandfather of a mysterious illness, how it had been served at every family wedding for a century, how during the revolution it had been traded for safe passage across contested territories. With each story, she added a pinch of something to the pot: salt harvested from a specific coastal region, honey from bees that pollinated only orange blossoms, herbs grown in soil enriched by volcanic ash.

When moonlight finally spilled through the window, Abuela handed Maya three dried chiles, each a different variety. "Now you finish it. But remember, as you add each one, you must think of something you wish to preserve, something you wish to transform, and something you wish to understand."

Maya hesitated, the weight of tradition suddenly heavy in her palm. "What if I get it wrong?"

"The sauce knows what you need better than you do," Abuela replied. "That's why no two batches taste exactly the same, even when made by the same hands."

Maya dropped the first chile into the pot, closing her eyes to focus on her intentions. The kitchen filled with an aroma that reminded her simultaneously of home and of places she had never been but somehow recognized—ancestral memories awakening with each bubble that rose to the surface."""
]

# Function to generate a random document
def generate_random_document():
    # Choose content type with weighted distribution
    content_type = random.choices(
        ["positive", "negative", "neutral", "technical", "creative"],
        weights=[0.25, 0.25, 0.2, 0.15, 0.15],
        k=1
    )[0]
    
    # Select content based on type
    if content_type == "positive":
        content = random.choice(POSITIVE_CONTENT)
    elif content_type == "negative":
        content = random.choice(NEGATIVE_CONTENT)
    elif content_type == "neutral":
        content = random.choice(NEUTRAL_CONTENT)
    elif content_type == "technical":
        content = random.choice(TECHNICAL_CONTENT)
    else:  # creative
        content = random.choice(CREATIVE_CONTENT)
    
    # Generate random date within last 2 years
    days_back = random.randint(1, 730)  # Up to 2 years back
    date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    
    # Create document with metadata
    document = {
        "title": random.choice(SAMPLE_TITLES),
        "content": content,
        "author": random.choice(SAMPLE_AUTHORS),
        "date": date,
        "category": random.choice(SAMPLE_CATEGORIES)
    }
    
    return document

# Main function to generate and save sample data
def main():
    # Create data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Generate documents
    num_documents = 18  # Generate 18 documents (more than the required 15)
    documents = {}
    
    for i in range(num_documents):
        doc = generate_random_document()
        doc_id = f"doc_{int(time.time())}_{i+1}"
        doc["id"] = doc_id
        doc["added_at"] = datetime.now().isoformat()
        documents[doc_id] = doc
    
    # Save to JSON file
    with open(os.path.join(data_dir, "documents.json"), "w") as f:
        json.dump(documents, f, indent=2)
    
    print(f"Generated {num_documents} sample documents and saved to {os.path.join(data_dir, 'documents.json')}")

if __name__ == "__main__":
    import time  # Import here to avoid conflict with datetime.time
    main()