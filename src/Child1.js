import React, { Component } from "react";
import * as d3 from "d3";
import './Child1.css';

class Child1 extends Component {
  state = {};

  componentDidMount() {
    console.log(this.props.csv_data) // Use this data as default. When the user will upload data this props will provide you the updated data
    this.renderGraph()
  }

  componentDidUpdate() {
    console.log(this.props.csv_data)
    this.renderGraph();
  }

  renderGraph() {
    const data = this.props.csv_data;
    console.log('data', data);

    if (!data || data.length === 0) {
      d3.select('.container').selectAll('*').remove();
      return;
    }

    const maxSum = d3.sum([
      d3.max(data, d => d['GPT-4']),
      d3.max(data, d => d['Gemini']),
      d3.max(data, d => d['PaLM-2']),
      d3.max(data, d => d['Claude']),
      d3.max(data, d => d['LLaMA-3.1'])
    ]);

    const margin = { top: 20, right: 20, bottom: 30, left: 30 },
      w = 600,
      h = 600,
      innerW = w - margin.left - margin.right,
      innerH = h - margin.top - margin.bottom;
    
    const models = ['LLaMA-3.1', 'Claude', 'PaLM-2', 'Gemini', 'GPT-4'];

    const xScale = d3.scaleTime().domain(d3.extent(data, d => d.Date)).range([margin.left, innerW]);
    const yScale = d3.scaleLinear().domain([0, maxSum]).range([innerH, 0]);
    const colorScale = d3.scaleOrdinal().domain(models)
      .range(["#FE7100", "#8C4296", "#43A340", "#2E71AD", "#DD1719"]);

    let stackGen = d3.stack().keys(['GPT-4', 'Gemini', 'PaLM-2', 'Claude', 'LLaMA-3.1'])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetWiggle),
      stackedSeries = stackGen(data);
      
      console.log('stackedSeries', stackedSeries);
    
    let areaGen = d3.area()
      .x(d => xScale(d.data.Date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCardinal);

    const container = d3.select('.container').attr('width', w).attr('height', h);
    const graphGroup = container.selectAll('.graph-group').data([null]).join('g')
      .attr('class', 'graph-group')
      .attr('transform', `translate(0, -150)`);
  
    let div = d3.select('body').selectAll('.tooltip').data([null]).join('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '10px')
      .style('border-radius', '10px');

    graphGroup.selectAll('.areas').data(stackedSeries).join('path')
      .attr('class', 'areas')
      .attr('d', d => areaGen(d))
      .attr('fill', d => colorScale(d.key))
      .on('mousemove', (event, d) => {
        div.selectAll('*').remove();

        const model = d.key;
        const tooltipMargin = { top: 20, right: 20, bottom: 30, left: 30 },
          tooltipW = 300,
          tooltipH = 200,
          tooltipInnerW = tooltipW - tooltipMargin.left - tooltipMargin.right,
          tooltipInnerH = tooltipH - tooltipMargin.top - tooltipMargin.bottom;
        
        const modelData = data.map(entry => ({
          Date: entry.Date,
          Model: model,
          Value: entry[model]
        }));
        console.log('modelData', modelData);

        div.style('opacity', 0.9)
          .style('display', 'block')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 20}px`);

        const tooltipSvg= div.selectAll('.tooltip-svg').data([null]).join('svg')
          .attr('class', 'tooltip-svg')
          .attr('width', tooltipW)
          .attr('height', tooltipH);
        
        const tooltipBarChart = tooltipSvg.selectAll('.tooltip-barchart').data([null]).join('g')
          .attr('class', 'tooltip-barchart')
          .attr('transform', `translate(${tooltipMargin.left}, ${tooltipMargin.top})`);
        
        const xBarScale = d3.scaleBand().domain(modelData.map(d => d.Date)).range([0, tooltipInnerW]).padding(0.1);
        const yBarScale = d3.scaleLinear().domain([0, d3.max(modelData, d => d.Value)]).range([tooltipInnerH, 0]);

        tooltipBarChart.selectAll('rect').data(modelData).join('rect')
          .attr('x', d => xBarScale(d.Date))
          .attr('y', d => yBarScale(d.Value))
          .attr('width', xBarScale.bandwidth())
          .attr('height', d => tooltipInnerH - yBarScale(d.Value))
          .attr('fill', colorScale(model));
        
        tooltipBarChart.selectAll('.x-axis').data([null]).join('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0, ${tooltipInnerH})`)
          .call(d3.axisBottom(xBarScale).tickFormat(d3.timeFormat('%b')));
        
        tooltipBarChart.selectAll('.y-axis').data([null]).join('g')
          .attr('class', 'y-axis')
          .call(d3.axisLeft(yBarScale));
      })
      .on('mouseout', () => {
        div.transition().duration(50)
          .style('opacity', 0)
          .on('end', () => div.style('display', 'none'));
      })

      graphGroup.selectAll('x-axis').data([null]).join('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${h + 50})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b')))
        .style('font-size', 12)

      const legend = d3.select('.legend')
        .attr('width', 200)
        .attr('height', 300)
        .attr('transform', `translate(0, 150)`);
      
      const legendItems = legend.selectAll('.legend-items').data(models).join('g')
        .attr('class', 'legend-items')
        .attr('transform', (d, i) => `translate(0, ${i * 50})`)
      
      legendItems.selectAll('rect').data(d => [d]).join('rect')
        .attr('height', 40)
        .attr('width', 40)
        .attr('fill', d => colorScale(d))

      legendItems.selectAll('text').data(d => [d]).join('text')
      .attr('transform', (d, i) => `translate(50, 25)`)
      .text(d => d)
  }

  render() {
    return (
      <div className="child1">
        <div className="svg-div">
          <svg className="container"></svg>
          <svg className="legend"></svg>
        </div>
      </div>
    );
  }
}

export default Child1;
