<template>
	<div class="cubic-bezier">
		<ParamControl
			:exp="exp"
			@input="$emit('input', $event)"
			@select="$emit('select', $event)"
		/>
		<svg class="cubic-bezier__svg" ref="svgEl">
			<line class="diagonal" x1="0" :y1="size[1]" :x2="size[1]" y2="0" />
			<path
				class="curve"
				:d="`M 0,${size[1]} C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${size[0]},0`"
			/>

			<line class="handle" x1="0" :y1="size[1]" :x2="c1[0]" :y2="c1[1]" />
			<line class="handle" :x1="size[0]" y1="0" :x2="c2[0]" :y2="c2[1]" />

			<line class="t" :x1="tx" y1="0" :x2="tx" :y2="size[1]" />

			<circle
				ref="c1El"
				:cx="c1[0]"
				:cy="c1[1]"
				:r="radius"
				:dragging="isDraggingC1"
			/>
			<circle
				ref="c2El"
				:cx="c2[0]"
				:cy="c2[1]"
				:r="radius"
				:dragging="isDraggingC2"
			/>
		</svg>
	</div>
</template>

<script lang="ts">
import {
	defineComponent,
	SetupContext,
	ref,
	Ref,
	computed,
	toRefs
} from '@vue/composition-api'
import {MalVal, isList, getEvaluated, cloneExp} from '@/mal/types'
import {NonReactive, nonReactive, clamp} from '@/utils'
import {useResizeSensor, useDraggable, useRem} from '@/components/use'
import ParamControl from '@/components/ParamControl.vue'

interface Props {
	exp: NonReactive<MalVal[]>
}

export default defineComponent({
	name: 'cubic-bezier',
	components: {
		ParamControl
	},
	props: {
		exp: {
			required: true,
			validator: x => x instanceof NonReactive && isList(x.value)
		}
	},
	setup(props: Props, context: SetupContext) {
		const svgEl: Ref<null | HTMLElement> = ref(null)
		const c1El: Ref<null | HTMLElement> = ref(null)
		const c2El: Ref<null | HTMLElement> = ref(null)

		const size = ref([0, 0])

		useResizeSensor(
			svgEl,
			(el: HTMLElement) => {
				const {width, height} = el.getBoundingClientRect()
				size.value = [width, height]
			},
			true
		)

		const tx = computed(
			() => size.value[0] * (getEvaluated(props.exp.value[1]) as number)
		)

		const c1 = computed(() => {
			return [
				size.value[0] * (props.exp.value[2] as number),
				size.value[1] * (1 - (props.exp.value[3] as number))
			]
		})

		const c2 = computed(() => {
			return [
				size.value[0] * (props.exp.value[4] as number),
				size.value[1] * (1 - (props.exp.value[5] as number))
			]
		})

		// Saves the value on dragstart
		let ox = 0,
			oy = 0

		const c1Drag = useDraggable(c1El, {
			onDragStart() {
				ox = props.exp.value[2] as number
				oy = props.exp.value[3] as number
			},
			onDrag(e) {
				const dx = e.x / size.value[0]
				const dy = e.y / -size.value[1]

				const exp = cloneExp(props.exp.value) as number[]

				exp[2] = clamp(ox + dx, 0, 1)
				exp[3] = oy + dy

				context.emit('input', nonReactive(exp))
			}
		})

		const c2Drag = useDraggable(c2El, {
			onDragStart() {
				ox = props.exp.value[4] as number
				oy = props.exp.value[5] as number
			},
			onDrag(e) {
				const dx = e.x / size.value[0]
				const dy = e.y / -size.value[1]

				const exp = cloneExp(props.exp.value) as number[]

				exp[4] = clamp(ox + dx, 0, 1)
				exp[5] = oy + dy

				context.emit('input', nonReactive(exp))
			}
		})

		const rem = useRem()
		const radius = computed(() => rem.value * 0.5)

		return {
			svgEl,
			c1El,
			c2El,
			size,
			tx,
			c1,
			c2,
			radius,
			isDraggingC1: toRefs(c1Drag).isDragging,
			isDraggingC2: toRefs(c2Drag).isDragging
		}
	}
})
</script>

<style lang="stylus">
@import '../style/common.styl'

.cubic-bezier
	position relative
	display flex

	&__svg
		flex 0 0 15rem
		width 15rem
		height 15rem
		border 1px solid var(--border)
		margin-left .5rem


		circle
			fill var(--background)
			stroke var(--highlight)
			stroke-width 1

			&:hover, &[dragging]
				stroke-width 3

		path, line
			fill none
			stroke var(--highlight)
			stroke-width 1px

		.diagonal
			stroke-dasharray 3 3
			stroke var(--border)

		.curve
			stroke-width 3

		.t
			stroke var(--red)

			&:hover
				stroke-width 3
</style>
