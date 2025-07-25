<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {DateTime, Duration, Interval} from 'luxon'
    import {events} from '../stores/event'
    import * as d3 from 'd3'
    import {screenWidthL, screenWidthM, screenWidthS, screenWidthXL} from '../stores/navigation'


    export let data = []
    export let selectedDay = DateTime.now().toSQLDate()

    let eventData
    let groupData
    let capacityData
    let maxCapacity = 0

    const chartWidth = 1000
    let chartMarginLeft = 20
    let chartMarginTop = 20
    let chartSpacingEvents = 58
    let chartSpacingGroups = 5
    const barHeight = 1.5
    let barWidth

    const hoverColor = 'yellow'
    const selectColor = 'orange'
    let eventColor
    let groupColor

    let scaleFactor = 1.
    let scaleFactorCircle = 1.
    let barHeightEvent = 17
    let fontSize10 = 10
    let fontSize12 = 12

    const color = d3.scaleOrdinal()
        .domain(['cancelled', 'stayers', 'eventstayers', 'total', 'waitinglist'])
        .range(['gray','#5EAAA8', '#A3D2CA', 'black', 'lightgray'])

    let d3Svg, d3Bg, d3Stayers, d3Capacity, d3Arrival, d3Departure, d3Events, d3Groups, d3Hover
    let xAxisDate, xAxisMonth, yAxisCount
    let xScaleBars, xScaleEvents, yScaleArrivalDeparture, yScaleStayers, yScaleEvents, yScaleGroups


    const dispatch = createEventDispatcher()

    $: ($screenWidthS || $screenWidthM || $screenWidthL || $screenWidthXL) && adjustPeriodWidth()
    $: data && update()
    $: selectedDay && update()


    onMount(async ()=> {

        d3Svg = d3.select('#dash-d3')
            .select('svg')
            .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')

        d3Bg = d3Svg.append('g')
        xAxisDate = d3Svg.append('g')
        xAxisMonth = d3Svg.append('g')
        yAxisCount = d3Svg.append('g')
        d3Stayers = d3Svg.append('g')
        d3Capacity = d3Svg.append('g')
        d3Departure = d3Svg.append('g')
        d3Arrival = d3Svg.append('g')
        d3Events = d3Svg.append('g')
        d3Groups = d3Svg.append('g')
        d3Hover = d3Svg.append('g')

        eventColor = d3.scaleOrdinal()
            .domain([...$events.map(e => e.abbreviation)])
            .range(d3.schemeDark2)
    })

    function adjustPeriodWidth() {
        scaleFactor = $screenWidthS ? 2 : $screenWidthM ? 1.5 : $screenWidthL ? 1.2 : 1
        scaleFactorCircle = $screenWidthS ? 0.25 : $screenWidthM ? 0.31 : $screenWidthL ? 0.35 : 0.36
        chartMarginLeft = 20 * scaleFactor
        chartMarginTop = 20 * scaleFactor
        chartSpacingEvents = 58 * scaleFactor
        chartSpacingGroups = 5 * scaleFactor
        barHeightEvent = 17 * scaleFactor
    }

    function update() {

        if (data === undefined || d3Svg === undefined || data.length === 0)
            return

        const chartStartDate = d3.min(data, d => DateTime.fromSQL(d.date))
        const chartEndDate = d3.max(data, d => DateTime.fromSQL(d.date).endOf('day'))

        eventData = new Map()
        data.map(stat => stat.events).forEach(stat => stat.forEach(event => eventData.set(event.abbreviation, event)))
        eventData.forEach(e => e.chart_start = DateTime.fromSQL(e.start_date) >= chartStartDate ? DateTime.fromSQL(e.start_date): chartStartDate)
        eventData.forEach(e => e.chart_end = DateTime.fromSQL(e.end_date) <= chartEndDate ? DateTime.fromSQL(e.end_date).endOf('day') : chartEndDate.endOf('day'))
        eventData = [...eventData.values()]

        groupData = new Map()
        // inelegant and complicated hack to deal with multiple groups of same name
        let gCnt = new Map()
        data.map(stat => {return {date: stat.date, groups: stat.groups}}).forEach(stat => stat.groups.forEach(group => {
            if (!gCnt.has(group))
                gCnt.set(group, 0)
            let gId = group + '-' + gCnt.get(group)
            if (groupData.has(gId)) {
                if (groupData.get(gId).end_date !== undefined && Interval.fromDateTimes(groupData.get(gId).end_date, DateTime.fromSQL(stat.date)).length('days') > 1) {
                    gCnt.set(group, gCnt.get(group) + 1)
                    gId = group + '-' + gCnt.get(group)
                    groupData.set(gId, {group: group, start_date: DateTime.fromSQL(stat.date), end_date: DateTime.fromSQL(stat.date).endOf('day')})
                } else
                    groupData.set(gId, {group: group, start_date: groupData.get(gId).start_date, end_date: DateTime.fromSQL(stat.date).endOf('day')})
            } else
                groupData.set(gId, {group: group, start_date: DateTime.fromSQL(stat.date), end_date: DateTime.fromSQL(stat.date).endOf('day')})
        }))
        groupData = [...groupData.values()]

        groupColor = d3.scaleOrdinal()
            .domain([...groupData.map(g => g.group)])
            .range(d3.schemePastel1)

        capacityData = []
        data.map(stat => {return {date: stat.date, max_capacity: stat.max_capacity}}).forEach(day => {
            if (capacityData.length === 0 || day.max_capacity !== capacityData[capacityData.length-1].max_capacity)
                capacityData.push({max_capacity: day.max_capacity, start_date: DateTime.fromSQL(day.date), end_date: DateTime.fromSQL(day.date).endOf('day')})
            else
                capacityData[capacityData.length-1] = ({max_capacity: day.max_capacity, start_date: capacityData[capacityData.length-1].start_date, end_date: DateTime.fromSQL(day.date).endOf('day')})
        })
        maxCapacity = d3.max(data, d => d.max_capacity)

        // const maxStayers = data.reduce((prev, curr) => Math.max(prev, curr.total), 0)
        const maxStayers = 130
        const stayersHeight = maxStayers * barHeight
        const eventsHeight = eventData.length * barHeightEvent
        const groupsHeight = groupData.length * barHeightEvent
        const chartHeightTotal = chartMarginTop + stayersHeight + eventsHeight + groupsHeight + chartSpacingEvents + chartSpacingGroups

        d3Svg.attr('viewBox', [0, 0, chartWidth + chartMarginLeft, chartHeightTotal])
        d3Hover.attr('transform', 'translate(' + chartMarginLeft + ', ' + chartMarginTop + ')')
        d3Bg.attr('transform', 'translate(' + chartMarginLeft + ', ' + chartMarginTop + ')')
        xAxisDate.attr('transform', 'translate(' + chartMarginLeft + ', ' + (chartMarginTop + stayersHeight + 3) + ')')
        xAxisMonth.attr('transform', 'translate(' + chartMarginLeft + ', ' + chartMarginTop + ')')
        yAxisCount.attr('transform', 'translate(' + chartMarginLeft + ', ' + chartMarginTop + ')')
        d3Stayers.attr('transform', 'translate(' + chartMarginLeft + ', ' + chartMarginTop + ')')
        d3Capacity.attr('transform', 'translate(' + chartMarginLeft + ',' + chartMarginTop + ')')
        d3Arrival.attr('transform', 'translate(' + chartMarginLeft + ', ' + (chartMarginTop + stayersHeight + 30 * scaleFactor) + ')')
        d3Departure.attr('transform', 'translate(' + chartMarginLeft + ', ' + (chartMarginTop + stayersHeight + 42 * scaleFactor) + ')')
        d3Events.attr('transform', 'translate(' + chartMarginLeft + ', ' + (chartMarginTop + stayersHeight + chartSpacingEvents) + ')')
        d3Groups.attr('transform', 'translate(' + chartMarginLeft + ', ' + (chartMarginTop + stayersHeight + eventsHeight + chartSpacingEvents + chartSpacingGroups) + ')')

        yScaleStayers = d3.scaleLinear()
            .domain([0, maxStayers])
            .range([stayersHeight, 0])

        barWidth = chartWidth / data.length

        xScaleBars = d3.scaleBand()
            .domain(data.map(d => DateTime.fromSQL(d.date)))
            .range([0, chartWidth])
            .paddingInner(0.1)

        const xAxis = d3.axisBottom(xScaleBars)
            .tickSize(-stayersHeight)
            .tickFormat(d3.timeFormat('%-d.'))

        xAxisDate.call(xAxis)
            .select('.domain').remove()
        xAxisDate.call(g => g.selectAll('.tick')
            .selectAll('line')
            .attr("x1", -barWidth/2)
            .attr("x2", -barWidth/2)
            .attr("y1", 12)
            .style('color', 'lightgray')
            .style('shape-rendering', 'crispEdges')
            .filter((d) => d.weekday !== 1)
            .remove())
        xAxisDate.call(g => g.selectAll('.tick text')
            .attr('font-size', fontSize10 * scaleFactor))

        const xAxisM = d3.axisTop(xScaleBars)
            .tickSize(-stayersHeight - 14 - 12)
            .tickFormat(d => d.monthLong)

        xAxisMonth.selectAll('g')
            .remove()
        xAxisMonth.call(xAxisM)
            .select('.domain').remove()
        xAxisMonth.call(g => g.selectAll('.tick')
            .attr('id', d => d)
            .filter((d, i) => !(d.day === 1 || i === 0 && (d.daysInMonth - d.day >= 2)))
            .remove())
        xAxisMonth.call(g => g.selectAll('.tick line')
            .style('shape-rendering', 'crispEdges')
            .attr('transform', 'translate(0, -12)')
            .attr("x1", -barWidth/2)
            .attr("x2", -barWidth/2)
            .filter(d => chartStartDate.toMillis() === d.toMillis())
            .remove())
        xAxisMonth.call(g => g.selectAll('.tick text')
            .attr("id", d => d.month))
        xAxisMonth.call(g => g.selectAll('.tick text')
            .attr("x", d => document.getElementById(d.month).getBBox().width / 2 - barWidth / 2 + 6 * scaleFactor * 2)
            .attr('color', 'black')
            .attr('font-size', fontSize12 * scaleFactor))

        const yScaleBars = d3.scaleLinear()
            .range([stayersHeight, 0])
            .domain([0, maxStayers])

        const yAxis = d3.axisLeft(yScaleBars)
            .tickValues(yScaleBars.ticks().filter(n => n % 20 === 0))
            .tickFormat(d3.format('d'))
            .tickSize(-chartWidth)

        yAxisCount.call(yAxis)
            .call(g => g.select('.domain')
                .remove())
            .call(g => g.selectAll('.tick line')
                .attr('stroke-dasharray', (d, i) => i === 0 ? null : '2,2')
                .attr('stroke-opacity', (d, i) => i === 0 ? 1 : 0.5)
                .attr('stroke-width', (d, i) => i === 0 ? 1 : 0.5))
            .call(g => g.selectAll('.tick text')
            .attr('font-size', fontSize10 * scaleFactor))

        xScaleEvents = d3.scaleLinear()
            .domain([chartStartDate.toJSDate(), chartEndDate.toJSDate()])
            .range([0, chartWidth])

        yScaleEvents = d3.scaleBand()
            .domain(d3.range(eventData.length))
            .range([eventsHeight, 0])
            .paddingInner(0.1)

        yScaleGroups = d3.scaleBand()
            .domain(d3.range(groupData.length))
            .range([groupsHeight, 0])
            .paddingInner(0.1)

        updateBgHover(chartHeightTotal)
        updateStayers()
        updateCapacity()
        updateEvents()
        updateGroups()
    }

    function updateStayers() {

        const series = d3.stack()
            .keys(['stayers', 'eventstayers'])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone)
            (data)

        d3Stayers.selectAll('g').remove()
        d3Stayers.append('g')
            .selectAll('g')
            .data(series)
            .join('g')
            .attr('fill', d => color(d.key))
            .selectAll('rect')
            .data(d => d)
            .join('rect')
            .attr('x', d => xScaleBars(DateTime.fromSQL(d.data.date).toJSDate()))
            .attr('y', d => yScaleStayers(d[1]))
            .attr('width', xScaleBars.bandwidth())
            .attr('height', d => yScaleStayers(d[0]) - yScaleStayers(d[1]))

        d3Arrival.selectAll('circle')
            .data(data)
            .join('circle')
            .attr('cx', d => xScaleBars(DateTime.fromSQL(d.date).toJSDate()) + xScaleBars.bandwidth() * 0.33)
            .attr('r', xScaleBars.bandwidth() * scaleFactorCircle)
            .style('fill', d => d3.interpolateTurbo(0.67 + d.arrivals / maxCapacity / 3))
            .style('opacity', d => d.arrivals > 0 ? 1 : 0)

        d3Arrival.selectAll('text')
            .data(data)
            .join('text')
            .text(d => d.arrivals > 0 ? '+' + d.arrivals : null)
            .attr('x', d => xScaleBars(DateTime.fromSQL(d.date).toJSDate()) + xScaleBars.bandwidth() * 0.33)
            .attr('y', 0.5)
            .style('text-anchor', 'middle')
            .style('dominant-baseline', 'middle')
            .attr('font-size', fontSize10 * scaleFactor)
            .style('fill', 'white')

        d3Departure.selectAll('circle')
            .data(data)
            .join('circle')
            .attr('cx', d => xScaleBars(DateTime.fromSQL(d.date).toJSDate()) + xScaleBars.bandwidth() * 0.66)
            .attr('r', xScaleBars.bandwidth() * scaleFactorCircle)
            .style('fill', d => d3.interpolatePuBu(0.33 + d.departures / maxCapacity / 3))
            .style('opacity', d => d.departures > 0 ? 0.5 : 0)

        d3Departure.selectAll('text')
            .data(data)
            .join('text')
            .text(d => d.departures > 0 ? '-' + d.departures : null)
            .attr('x', d => xScaleBars(DateTime.fromSQL(d.date).toJSDate()) + xScaleBars.bandwidth() * 0.66)
            .attr('y', 0.5)
            .style('text-anchor', 'middle')
            .style('dominant-baseline', 'middle')
            .attr('font-size', fontSize10 * scaleFactor)
            .style('fill', 'black')
    }

    function updateCapacity() {

        d3Capacity.selectAll('line')
            .data(capacityData)
            .join('line')
            .attr('x1', d => xScaleEvents(d.start_date.toJSDate()))
            .attr('y1', d => yScaleStayers(d.max_capacity))
            .attr('x2', d => xScaleEvents(d.end_date.toJSDate()))
            .attr('y2', d => yScaleStayers(d.max_capacity))
            .attr('stroke', 'red')
            .attr('stroke-width', scaleFactor)
            .attr('opacity', 0.8)
            .style('shape-rendering', 'crispEdges')
            // .attr('stroke-dasharray', '4 1')
    }

    function updateEvents() {

        d3Events.selectAll('rect')
            .data(eventData, d => d.abbreviation)
            .join('rect')
            .attr('x', d => xScaleEvents(d.chart_start.toJSDate()))
            .attr('width', d => xScaleEvents(d.chart_end.toJSDate()) - xScaleEvents(d.chart_start.toJSDate()))
            .attr('y', (d, i) => yScaleEvents(i))
            .attr('height', yScaleEvents.bandwidth())
            .attr('rx', 2 * scaleFactor)
            // .attr('fill', d => eventColor(d.abbreviation))
            .attr('fill', '#550A46')
            .attr('opacity', 0.8)

        d3Events.selectAll('text')
            .data(eventData, d => d.abbreviation)
            .join('text')
            .text(d => d.abbreviation)
            .attr('x', d => xScaleEvents(d.chart_start.toJSDate()) + 4)
            .attr('y', (d, i) => yScaleEvents(i) + (yScaleEvents.bandwidth() - fontSize12 * scaleFactor) / 2 + 1)
            .attr("font-size", fontSize12 * scaleFactor)
            .attr('fill', 'white')
            .style('text-anchor', 'start')
            .style('dominant-baseline', 'hanging')
    }

    function updateGroups() {

        d3Groups.selectAll('rect')
            .data(groupData, d => d.group)
            .join('rect')
            .attr('x', d => xScaleEvents(d.start_date.toJSDate()))
            .attr('width', d => xScaleEvents(d.end_date.toJSDate()) - xScaleEvents(d.start_date.toJSDate()))
            .attr('y', (d, i) => yScaleGroups(i))
            .attr('height', yScaleGroups.bandwidth())
            .attr('rx', 2 * scaleFactor)
            // .attr('fill', d => groupColor(d.group))
            .attr('fill', '#204051')
            .attr('opacity', 0.8)

        d3Groups.selectAll('text')
            .data(groupData, d => d.group)
            .join('text')
            .text(d => d.group)
            .attr('x', d => xScaleEvents(d.start_date.toJSDate()) + 4)
            .attr('y', (d, i) => yScaleGroups(i) + (yScaleGroups.bandwidth() - fontSize12 * scaleFactor) / 2 + 1)
            .attr("font-size", fontSize12 * scaleFactor)
            .attr('fill', 'white')
            .style('text-anchor', 'start')
            .style('dominant-baseline', 'hanging')
    }

    function updateBgHover(chartHeightTotal) {

        d3Bg.selectAll('rect')
            .data(data, d => d.date)
            .join('rect')
            // .filter(d => )
            .attr('id', d => 'bg-ad-' + d.date)
            .attr('x', d => xScaleBars(DateTime.fromSQL(d.date).toJSDate()))
            .attr('width', xScaleBars.bandwidth())
            .attr('y', 0)
            .attr('height', chartHeightTotal)
            .style('opacity', 0.2)
            .style('fill', d => d.date === selectedDay ? selectColor : 'transparent')

        d3Hover.selectAll('rect')
            .data(data, d => d.date)
            .join('rect')
            .attr('id', d => 'hover-' + d.date)
            .attr('x', d => xScaleBars(DateTime.fromSQL(d.date).toJSDate()))
            .attr('width', barWidth)
            .attr('y', 0)
            .attr('height', chartHeightTotal)
            .style('fill', 'transparent')
            .style('opacity', 0.3)
            .on('mouseover', (event, d) => {
                d3.select('#hover-' + d.date)
                    .style('fill', hoverColor)
                d3.select('#tooltip')
                    .classed('hidden', false)
                d3.select('#tooltipHead').text(DateTime.fromSQL(d.date).toFormat('ccc dd. LLL'))
                let newHtml = []
                newHtml.push('<tr>',
                    '<td style="padding-left: 4px; background-color: ' + d3.interpolateTurbo(0.67 + d.arrivals / maxCapacity / 3) + '"></td>',
                    '<td style="padding-left: 4px">Arrivals: </td>',
                    '<td style="padding-left: 4px padding-right: 4px"><strong>' + d.arrivals + '</strong></td>',
                    '</tr>')
                newHtml.push('<tr>',
                    '<td style="padding-left: 4px; background-color: ' + d3.interpolatePuBu(0.33 + d.departures / maxCapacity / 3) + '"></td>',
                    '<td style="padding-left: 4px">Departures: </td>',
                    '<td style="padding-left: 4px padding-right: 4px"><strong>' + d.departures + '</strong></td>',
                    '</tr>')
                if (d.cancelled > 0) {
                    newHtml.push('<tr>',
                        '<td style="padding-left: 4px; background-color: ' + color('cancelled') + '"></td>',
                        '<td style="padding-left: 4px">Cancelled: </td>',
                        '<td style="padding-left: 4px padding-right: 4px"><strong>' + d.cancelled + '</strong></td>',
                        '</tr>')
                }
                d3.select('#tooltipArrivalDeparture').html(newHtml.join(""))
                newHtml = []
                if (d.eventstayers > 0) {
                    newHtml.push('<tr>',
                        '<td style="padding-left: 4px; background-color: ' + color('eventstayers') + '"></td>',
                        '<td style="padding-left: 4px">Event stayers: </td>',
                        '<td style="padding-left: 4px padding-right: 4px"><strong>' + d.eventstayers + '</strong></td>',
                        '</tr>')
                }
                newHtml.push('<tr>',
                    '<td style="padding-left: 4px; background-color: ' + color('stayers') + '"></td>',
                    '<td style="padding-left: 4px">Stayers: </td>',
                    '<td style="padding-left: 4px padding-right: 4px"><strong>' + d.stayers + '</strong></td>',
                    '</tr>')
                newHtml.push('<tr>',
                    '<td style="padding-left: 4px" class="paf-tooltip-total"></td>',
                    '<td style="padding-left: 4px"><strong>Total: </strong></td>',
                    '<td style="padding-left: 4px padding-right: 4px"><strong>' + d.total + '</strong></td>',
                    '</tr>')
                d3.select('#tooltipStayers').html(newHtml.join(""))
                newHtml = []
                if (d.waitinglist > 0) {
                    newHtml.push('<tr>',
                        '<td style="padding-left: 4px; background-color: ' + color('waitinglist') + '"></td>',
                        '<td style="padding-left: 4px">Waiting list: </td>',
                        '<td style="padding-left: 4px padding-right: 4px"><strong>' + d.waitinglist + '</strong></td>',
                        '</tr>')
                    d3.select('#tooltipWaitingListDiv').classed('hidden', false)
                } else
                    d3.select('#tooltipWaitingListDiv').classed('hidden', true)
                d3.select('#tooltipWaitingList').html(newHtml.join(""))
            })
            .on('mousemove', (event, d) => {
                d3.select('#tooltip')
                    .style('left', (event.pageX + 30) + 'px')
                    .style('top', (event.pageY) + 'px')
            })
            .on('mouseout', (event, d) => {
                const i = d3Hover.selectAll('rect').nodes().indexOf(event.currentTarget)
                d3.select('#hover-' + d.date)
                    .style('fill', 'transparent')
                d3.select('#tooltip')
                    .classed('hidden', true)
            })
            .on('click', (event, d) => {
                dispatch('message', {
                    select: d.date
                })
            })
    }
</script>

<div id="dash-d3">
    {#if data.length === 0}
        Loading data...
    {:else }
        <svg></svg>
    {/if}
</div>