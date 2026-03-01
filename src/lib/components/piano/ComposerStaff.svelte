<script lang="ts">
	import type { ComposedNote, ComposerKey, StaffMode, NoteDuration, PitchZone } from '$lib/types/piano';
	import type { ResolvedPitch, ResolvedNote } from '$lib/utils/composer-data';
	import {
		TREBLE_CLEF_PATH,
		STAFF_LINE_POSITIONS,
		STAFF_GEOMETRY,
		yForStaffPosition,
		resolveFullStavePitch,
		resolveThreeLinePitch,
		resolveOneLinePitch,
		keySignaturePositions
	} from '$lib/utils/composer-data';

	interface Props {
		notes: ComposedNote[];
		staffMode: StaffMode;
		selectedDuration: NoteDuration;
		notesPerLine: number;
		selectedNoteId: string | null;
		currentPlaybackIndex: number;
		showColours: boolean;
		showNoteLabels: boolean;
		rootNote: ComposerKey;
		currentThreeLineNotes: Record<PitchZone, ResolvedNote>;
		currentOneLineNotes: Record<'low' | 'high', ResolvedNote>;
		onnoteplace: (note: Omit<ComposedNote, 'id' | 'duration'>) => void;
		onnoteselect: (id: string | null) => void;
	}

	let {
		notes,
		staffMode,
		selectedDuration,
		notesPerLine,
		selectedNoteId,
		currentPlaybackIndex,
		showColours,
		showNoteLabels,
		rootNote,
		currentThreeLineNotes,
		currentOneLineNotes,
		onnoteplace,
		onnoteselect
	}: Props = $props();

	const { lineSpacing, bottomLineY, staffLeft } = STAFF_GEOMETRY;

	// Key signature positions for sharp symbols
	let keySigPositions = $derived(keySignaturePositions(rootNote));

	// Shift startX right to accommodate key signature sharps
	let startX = $derived(
		staffMode === 'full' ? 80 + keySigPositions.length * 10 : 45
	);

	// Layout: each note gets an equal-width slot.
	// Fixed mode (1-10): slots sized so N notes fill the stave width exactly.
	// Unlimited mode (0): fixed slot width, stave grows as notes are added.
	const VIEW_BASE_WIDTH = 400;
	const RIGHT_PAD = 20;
	const UNLIMITED_SLOT_WIDTH = 50;

	let slotWidth = $derived(
		notesPerLine > 0
			? (VIEW_BASE_WIDTH - startX - RIGHT_PAD) / notesPerLine
			: UNLIMITED_SLOT_WIDTH
	);

	// ViewBox width: fixed for fixed mode, grows for unlimited
	let viewBoxWidth = $derived.by(() => {
		if (notesPerLine > 0) {
			// Fixed: base width covers notesPerLine slots; extend only if overflow
			const slotsNeeded = Math.max(notesPerLine, notes.length + 1);
			if (slotsNeeded > notesPerLine) {
				return startX + slotsNeeded * slotWidth + RIGHT_PAD;
			}
			return VIEW_BASE_WIDTH;
		}
		// Unlimited: grow with notes, minimum shows at least 6 slots
		const slotsNeeded = Math.max(6, notes.length + 1);
		return Math.max(VIEW_BASE_WIDTH, startX + slotsNeeded * UNLIMITED_SLOT_WIDTH + RIGHT_PAD);
	});

	let staffLineEnd = $derived(viewBoxWidth);

	// SVG style: when viewBox exceeds base width, scale the element proportionally
	// so the stave height stays constant (no vertical shrinking)
	let svgWidthStyle = $derived(
		viewBoxWidth > VIEW_BASE_WIDTH
			? `width: ${(viewBoxWidth / VIEW_BASE_WIDTH) * 100}%`
			: ''
	);

	// Three-line mode geometry
	const THREE_LINE_Y = { high: 60, middle: 85, low: 110 };
	// One-line mode geometry
	const ONE_LINE_Y = 85;

	// Dynamic zone labels for simplified modes
	let threeLineLabels = $derived({
		high: currentThreeLineNotes.high.noteName,
		middle: currentThreeLineNotes.middle.noteName,
		low: currentThreeLineNotes.low.noteName
	});

	let oneLineLabels = $derived({
		high: currentOneLineNotes.high.noteName,
		low: currentOneLineNotes.low.noteName
	});

	// Beam groups: consecutive eighth notes (2+ in a row) that share a beam bar
	let beamGroups = $derived.by(() => {
		const groups: { start: number; end: number }[] = [];
		let i = 0;
		while (i < notes.length) {
			if (notes[i].duration === 'eighth') {
				const start = i;
				while (i + 1 < notes.length && notes[i + 1].duration === 'eighth') {
					i++;
				}
				if (i > start) {
					groups.push({ start, end: i });
				}
			}
			i++;
		}
		return groups;
	});

	// Set of note indices that are in a beam group (skip individual flags for these)
	let beamedIndices = $derived.by(() => {
		const set = new Set<number>();
		for (const g of beamGroups) {
			for (let i = g.start; i <= g.end; i++) {
				set.add(i);
			}
		}
		return set;
	});

	function noteX(index: number): number {
		return startX + index * slotWidth + slotWidth / 2;
	}

	function noteY(note: ComposedNote): number {
		if (staffMode === 'full') {
			return yForStaffPosition(note.staffPosition);
		} else if (staffMode === 'three-line') {
			const yMap: Record<string, number> = { low: THREE_LINE_Y.low, middle: THREE_LINE_Y.middle, high: THREE_LINE_Y.high };
			return yMap[note.pitchZone] ?? THREE_LINE_Y.middle;
		} else {
			return note.pitchZone === 'high' ? ONE_LINE_Y - 15 : ONE_LINE_Y + 15;
		}
	}

	function handleStaffClick(e: MouseEvent) {
		const svg = (e.currentTarget as SVGSVGElement);
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

		// Check if clicking on an existing note (within 12px radius)
		for (let i = 0; i < notes.length; i++) {
			const nx = noteX(i);
			const ny = noteY(notes[i]);
			const dx = svgPt.x - nx;
			const dy = svgPt.y - ny;
			if (dx * dx + dy * dy < 144) {
				onnoteselect(notes[i].id);
				return;
			}
		}

		// Resolve pitch from click position
		let resolved;
		if (staffMode === 'full') {
			resolved = resolveFullStavePitch(svgPt.y, bottomLineY, lineSpacing, rootNote);
			if (!resolved) return;
		} else if (staffMode === 'three-line') {
			resolved = resolveThreeLinePitch(svgPt.y, THREE_LINE_Y, currentThreeLineNotes);
		} else {
			resolved = resolveOneLinePitch(svgPt.y, ONE_LINE_Y, currentOneLineNotes);
		}

		onnoteselect(null);
		onnoteplace(resolved);
	}

	// Ledger lines for a note in full stave mode
	function ledgerLinesForPosition(pos: number): number[] {
		const lines: number[] = [];
		if (pos <= -2) {
			for (let p = -2; p >= pos - (pos % 2 === 0 ? 0 : 1); p -= 2) {
				lines.push(p);
			}
		}
		if (pos >= 10) {
			for (let p = 10; p <= pos + (pos % 2 === 0 ? 0 : 1); p += 2) {
				lines.push(p);
			}
		}
		return lines;
	}

	function noteFill(note: ComposedNote): string {
		if (showColours) return note.colour;
		return '#374151';
	}

	function noteStroke(note: ComposedNote): string {
		if (showColours) return note.colour;
		return '#374151';
	}

	function isOpen(duration: NoteDuration): boolean {
		return duration === 'whole' || duration === 'half';
	}

	function hasStem(duration: NoteDuration): boolean {
		return duration !== 'whole';
	}

	function hasFlag(duration: NoteDuration): boolean {
		return duration === 'eighth';
	}

	// --- Hover preview state ---
	let hoverPreview = $state<ResolvedPitch | null>(null);
	let hoveringExistingNote = $state(false);
	let hoveredNoteIndex = $state(-1);

	// X position where the next placed note will land
	let nextNoteX = $derived(
		startX + notes.length * slotWidth + slotWidth / 2
	);

	// Y position of the hover preview
	let hoverPreviewY = $derived.by(() => {
		if (!hoverPreview) return 0;
		if (staffMode === 'full') {
			return yForStaffPosition(hoverPreview.staffPosition);
		} else if (staffMode === 'three-line') {
			const yMap: Record<string, number> = { low: THREE_LINE_Y.low, middle: THREE_LINE_Y.middle, high: THREE_LINE_Y.high };
			return yMap[hoverPreview.pitchZone] ?? THREE_LINE_Y.middle;
		} else {
			return hoverPreview.pitchZone === 'high' ? ONE_LINE_Y - 15 : ONE_LINE_Y + 15;
		}
	});

	let hoverPreviewLedgerLines = $derived.by(() => {
		if (!hoverPreview || staffMode !== 'full') return [];
		return ledgerLinesForPosition(hoverPreview.staffPosition);
	});

	function svgPoint(e: MouseEvent): DOMPoint {
		const svg = e.currentTarget as SVGSVGElement;
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		return pt.matrixTransform(svg.getScreenCTM()!.inverse());
	}

	function nearestExistingNoteIndex(svgPt: DOMPoint): number {
		for (let i = 0; i < notes.length; i++) {
			const nx = noteX(i);
			const ny = noteY(notes[i]);
			const dx = svgPt.x - nx;
			const dy = svgPt.y - ny;
			if (dx * dx + dy * dy < 144) return i;
		}
		return -1;
	}

	function handleMouseMove(e: MouseEvent) {
		const svgPt = svgPoint(e);

		// Check if hovering an existing note
		const nearIdx = nearestExistingNoteIndex(svgPt);
		if (nearIdx >= 0) {
			hoveringExistingNote = true;
			hoveredNoteIndex = nearIdx;
			hoverPreview = null;
			return;
		}
		hoveringExistingNote = false;
		hoveredNoteIndex = -1;

		// Resolve pitch from cursor Y
		let resolved: ResolvedPitch | null = null;
		if (staffMode === 'full') {
			resolved = resolveFullStavePitch(svgPt.y, bottomLineY, lineSpacing, rootNote);
		} else if (staffMode === 'three-line') {
			resolved = resolveThreeLinePitch(svgPt.y, THREE_LINE_Y, currentThreeLineNotes);
		} else {
			resolved = resolveOneLinePitch(svgPt.y, ONE_LINE_Y, currentOneLineNotes);
		}
		hoverPreview = resolved;
	}

	function handleMouseLeave() {
		hoverPreview = null;
		hoveringExistingNote = false;
		hoveredNoteIndex = -1;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="composer-staff-container" class:cursor-pointer={hoveringExistingNote}>
	<svg
		viewBox="0 0 {viewBoxWidth} 140"
		class="composer-staff-svg"
		style={svgWidthStyle}
		role="application"
		aria-label="Composer staff - click to place notes"
		onclick={handleStaffClick}
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
	>
		{#if staffMode === 'full'}
			<!-- Treble clef -->
			<g transform="translate(26, -9) scale(0.31)">
				<path d={TREBLE_CLEF_PATH} fill="#374151" />
			</g>

			<!-- Key signature sharps -->
			{#each keySigPositions as pos, i}
				<text
					x={72 + i * 10}
					y={yForStaffPosition(pos) + 4}
					font-size="12"
					font-weight="bold"
					fill="#374151"
					text-anchor="middle"
				>#</text>
			{/each}

			<!-- Staff lines -->
			{#each STAFF_LINE_POSITIONS as pos}
				<line
					x1="0"
					y1={yForStaffPosition(pos)}
					x2={staffLineEnd}
					y2={yForStaffPosition(pos)}
					stroke="#9ca3af"
					stroke-width="1"
				/>
			{/each}
		{:else if staffMode === 'three-line'}
			<!-- Three labelled lines with dynamic note names -->
			{#each [{ label: threeLineLabels.high, y: THREE_LINE_Y.high }, { label: threeLineLabels.middle, y: THREE_LINE_Y.middle }, { label: threeLineLabels.low, y: THREE_LINE_Y.low }] as line}
				{#if showNoteLabels}
					<text x="10" y={line.y + 4} font-size="10" fill="#9ca3af" font-weight="500">{line.label}</text>
				{/if}
				<line
					x1="0"
					y1={line.y}
					x2={staffLineEnd}
					y2={line.y}
					stroke="#9ca3af"
					stroke-width="1"
				/>
			{/each}
		{:else}
			<!-- Single line with dynamic note names -->
			{#if showNoteLabels}
				<text x="10" y={ONE_LINE_Y - 18} font-size="10" fill="#9ca3af" font-weight="500">{oneLineLabels.high}</text>
				<text x="10" y={ONE_LINE_Y + 24} font-size="10" fill="#9ca3af" font-weight="500">{oneLineLabels.low}</text>
			{/if}
			<line
				x1="0"
				y1={ONE_LINE_Y}
				x2={staffLineEnd}
				y2={ONE_LINE_Y}
				stroke="#9ca3af"
				stroke-width="1"
			/>
		{/if}

		<!-- Placed notes -->
		{#each notes as note, i}
			{@const cx = noteX(i)}
			{@const cy = noteY(note)}
			{@const fill = noteFill(note)}
			{@const stroke = noteStroke(note)}
			{@const isSelected = selectedNoteId === note.id}
			{@const isPlayback = currentPlaybackIndex === i}

			<!-- Ledger lines (full stave only) -->
			{#if staffMode === 'full'}
				{#each ledgerLinesForPosition(note.staffPosition) as lp}
					<line
						x1={cx - 12}
						y1={yForStaffPosition(lp)}
						x2={cx + 12}
						y2={yForStaffPosition(lp)}
						stroke="#9ca3af"
						stroke-width="1"
					/>
				{/each}
			{/if}

			<!-- Selection highlight -->
			{#if isSelected}
				<circle cx={cx} cy={cy} r="14" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="3,2" />
			{/if}

			<!-- Playback highlight -->
			{#if isPlayback}
				<circle cx={cx} cy={cy} r="14" fill="#3b82f620" stroke="#3b82f6" stroke-width="1.5" />
			{/if}

			<!-- Hover highlight -->
			{#if hoveredNoteIndex === i && !isSelected}
				<circle cx={cx} cy={cy} r="14" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="3,2" />
			{/if}

			<!-- Note head -->
			{#if isOpen(note.duration)}
				<ellipse
					{cx}
					{cy}
					rx="7"
					ry="5"
					fill="none"
					stroke={fill}
					stroke-width="1.5"
					transform="rotate(-15, {cx}, {cy})"
				/>
			{:else}
				<ellipse
					{cx}
					{cy}
					rx="7"
					ry="5"
					{fill}
					transform="rotate(-15, {cx}, {cy})"
				/>
			{/if}

			<!-- Stem -->
			{#if hasStem(note.duration)}
				<line x1={cx + 6} y1={cy} x2={cx + 6} y2={cy - 22} stroke={stroke} stroke-width="1.5" />
			{/if}

			<!-- Flag (eighth, only if not beamed) -->
			{#if hasFlag(note.duration) && !beamedIndices.has(i)}
				<path d="M{cx + 6} {cy - 22} C{cx + 6} {cy - 22} {cx + 14} {cy - 15} {cx + 14} {cy - 8}" fill="none" stroke={stroke} stroke-width="1.5" />
			{/if}

			<!-- Note name label -->
			{#if showNoteLabels}
				<text
					x={cx}
					y={cy + (staffMode === 'full' ? 20 : 22)}
					font-size="9"
					font-weight="500"
					fill={showColours ? fill : '#6b7280'}
					text-anchor="middle"
				>{note.noteName}</text>
			{/if}
		{/each}

		<!-- Beam bars connecting consecutive eighth notes -->
		{#each beamGroups as group}
			{@const x1 = noteX(group.start) + 6}
			{@const y1 = noteY(notes[group.start]) - 22}
			{@const x2 = noteX(group.end) + 6}
			{@const y2 = noteY(notes[group.end]) - 22}
			<line {x1} {y1} {x2} {y2} stroke="#374151" stroke-width="3" />
		{/each}

		<!-- Hover preview ghost note -->
		{#if hoverPreview && !hoveringExistingNote}
			{@const px = nextNoteX}
			{@const py = hoverPreviewY}
			{@const previewColour = showColours ? hoverPreview.colour : '#6b7280'}

			<g opacity="0.3">
				<!-- Ledger lines -->
				{#each hoverPreviewLedgerLines as lp}
					<line
						x1={px - 12}
						y1={yForStaffPosition(lp)}
						x2={px + 12}
						y2={yForStaffPosition(lp)}
						stroke="#9ca3af"
						stroke-width="1"
					/>
				{/each}

				<!-- Note head -->
				{#if isOpen(selectedDuration)}
					<ellipse
						cx={px}
						cy={py}
						rx="7"
						ry="5"
						fill="none"
						stroke={previewColour}
						stroke-width="1.5"
						transform="rotate(-15, {px}, {py})"
					/>
				{:else}
					<ellipse
						cx={px}
						cy={py}
						rx="7"
						ry="5"
						fill={previewColour}
						transform="rotate(-15, {px}, {py})"
					/>
				{/if}

				<!-- Stem -->
				{#if hasStem(selectedDuration)}
					<line x1={px + 6} y1={py} x2={px + 6} y2={py - 22} stroke={previewColour} stroke-width="1.5" />
				{/if}

				<!-- Flag -->
				{#if hasFlag(selectedDuration)}
					<path d="M{px + 6} {py - 22} C{px + 6} {py - 22} {px + 14} {py - 15} {px + 14} {py - 8}" fill="none" stroke={previewColour} stroke-width="1.5" />
				{/if}

				<!-- Note name -->
				{#if showNoteLabels}
					<text
						x={px}
						y={py + (staffMode === 'full' ? 20 : 22)}
						font-size="9"
						font-weight="500"
						fill={previewColour}
						text-anchor="middle"
					>{hoverPreview.noteName}</text>
				{/if}
			</g>

			<!-- Dashed line connecting cursor Y to placement position -->
			<line
				x1={px}
				y1={py - 8}
				x2={px}
				y2={py + 8}
				stroke={previewColour}
				stroke-width="0.5"
				stroke-dasharray="2,2"
				opacity="0.4"
			/>
		{/if}
	</svg>
</div>

<style>
	.composer-staff-container {
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-surface);
		cursor: crosshair;
	}

	.composer-staff-container.cursor-pointer {
		cursor: pointer;
	}

	.composer-staff-svg {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
