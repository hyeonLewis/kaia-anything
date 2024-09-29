import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import json
import os

# Load JSON data
def load_json(filename):
    with open(os.path.join('src/data/gasPrice', filename)) as f:
        return json.load(f)

data_files = {
    'Base Fee': 'baseFee.json',
    'Type 0 Gas Price': 'effectiveGasPriceForType0.json',
    'Type 2 Gas Price': 'effectiveGasPriceForType2.json',
    'Max Fee Per Gas': 'maxFeePerGas.json',
    'Max Priority Fee Per Gas': 'maxPriorityFeePerGas.json'
}

baseFee = load_json('baseFee.json')

increasing_blocks = []

for block in baseFee:
    if int(block) == 164129999:
        break
    if baseFee[block] < baseFee[str(int(block) + 1)]:
        increasing_blocks.append(str(int(block) + 1))

# Prepare data for plotting
def prepare_data(data):
    x, y = [], []
    for block, values in data.items():
        # block = int(block)
        if str(block) not in increasing_blocks:
            continue
        if isinstance(values, list):
            for value in values:
                x.append(int(block))
                y.append(float(value))
        else:
            x.append(int(block))
            y.append(float(values))
    return x, y

# Create separate scatter plots
for title, filename in data_files.items():
    data = load_json(filename)
    x, y = prepare_data(data)
    baseFee = load_json('baseFee.json')

# Prepare base fee data
    base_fee_x, base_fee_y = prepare_data(baseFee)
    base_fee_y = [value / 1e9 for value in base_fee_y]  # Convert to Gwei   
    
    # Convert y values to Gwei
    y = [value / 1e9 for value in y]

    plt.figure(figsize=(12, 6))
    scatter = plt.scatter(x, y, alpha=0.5, s=10)

    # Overlay base fee data
    #plt.scatter(base_fee_x, base_fee_y, alpha=0.5, s=10, color='red', label='Base Fee')
    
    plt.xlabel('Block Number')
    plt.ylabel('Gas Price (Gkei)')
    plt.title(f'{title} Scatter Plot')
    plt.grid(True, alpha=0.3)

    ax = plt.gca()
    ax.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: format(int(x), ',')))
    plt.xticks(rotation=45)
    
    # Add labels to some points (except for Base Fee)
    if title != 'Base Fee':
        for i in range(0, len(x)):
            # if i > 0 and y[i] != y[i-1]:
            plt.annotate(f'{y[i]:.2f}', (x[i], y[i]), 
                            xytext=(0, 5), textcoords='offset points', 
                            fontsize=8, rotation=45, ha='left', va='bottom')
    
    plt.tight_layout()
    plt.savefig(f'{title.lower().replace(" ", "_")}_scatter_plot.png', dpi=300)
    plt.close()

print("All plots have been generated and saved.")
